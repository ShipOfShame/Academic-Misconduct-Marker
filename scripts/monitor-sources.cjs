const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dns = require('node:dns/promises');
const net = require('node:net');
const {parseHTML} = require('linkedom');

const SCHEMA = 1;
const MAX_BYTES = 4 * 1024 * 1024;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = value => JSON.stringify(value, null, 2) + '\n';
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

function collectSources(data, inventory) {
  const sources = new Map();
  function add(url, kind, paperIds, identityIds, requestUrl = url) {
    const key = kind + ':' + requestUrl;
    if (!sources.has(key)) sources.set(key, {key, url, requestUrl, kind, paperIds: new Set(), identityIds: new Set()});
    const source = sources.get(key);
    paperIds.forEach(id => source.paperIds.add(id));
    identityIds.forEach(id => source.identityIds.add(id));
  }
  function source(raw, paperIds = [], identityIds = []) {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Sources must use public HTTPS URLs');
    u.hash = '';
    const arxiv = u.hostname === 'arxiv.org' && u.pathname.match(/^\/(?:abs|html|pdf)\/(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?\/?$/);
    if (arxiv) return add('https://arxiv.org/abs/' + arxiv[1], 'arxiv', paperIds, identityIds);
    if (u.hostname === 'github.com') {
      const [owner, repo, section, number] = u.pathname.split('/').filter(Boolean);
      if (!owner || (owner.toLowerCase() === 'shipofshame' && repo?.toLowerCase() === 'academic-misconduct-marker')) return;
      if (!repo) return add(u.href, 'github-profile', paperIds, identityIds, 'https://api.github.com/users/' + owner);
      const base = 'https://api.github.com/repos/' + owner + '/' + repo;
      const web = 'https://github.com/' + owner + '/' + repo;
      // Follow current upstream state even when the evidence cites an immutable commit.
      add(web, 'github-commits', paperIds, identityIds, base + '/commits?per_page=1');
      add(web + '/releases', 'github-releases', paperIds, identityIds, base + '/releases?per_page=100');
      add(web + '/issues', 'github-issues', paperIds, identityIds, base + '/issues?state=all&sort=updated&direction=desc&per_page=100');
      if (section === 'issues' && /^\d+$/.test(number)) {
        add(web + '/issues/' + number, 'github-issue', paperIds, identityIds, base + '/issues/' + number);
        add(web + '/issues/' + number, 'github-comments', paperIds, identityIds, base + '/issues/' + number + '/comments?per_page=100');
      }
      return;
    }
    if (u.hostname === 'orcid.org' && /^\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(u.pathname)) {
      return add(u.href, 'orcid', paperIds, identityIds, 'https://pub.orcid.org/v3.0' + u.pathname + '/record');
    }
    add(u.href, u.hostname === 'api.crossref.org' ? 'crossref' : 'page', paperIds, identityIds);
  }
  for (const paper of data.papers) {
    const identities = data.identities.filter(i => i.paperIds.includes(paper.id)).map(i => i.id);
    source(paper.url, [paper.id], identities);
    for (const finding of paper.findings) {
      source(finding.url, [paper.id], identities);
      for (const item of finding.evidence.sources) source(item.url, [paper.id], identities);
    }
  }
  for (const identity of data.identities) {
    for (const url of identity.sources) source(url, identity.paperIds, [identity.id]);
  }
  for (const paper of inventory.papers) source(paper.url, [paper.id], [inventory.identityId]);
  for (const item of inventory.sources) source(item.url, [], [inventory.identityId]);
  return [...sources.values()].map(s => ({...s, paperIds: [...s.paperIds].sort(), identityIds: [...s.identityIds].sort()})).sort((a, b) => a.key.localeCompare(b.key));
}

function publicAddress(address) {
  if (net.isIP(address) === 6) return /^[23][0-9a-f]{3}:/i.test(address);
  if (net.isIP(address) !== 4) return false;
  const [a, b] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) || (a === 198 && (b === 18 || b === 19)));
}

async function publicURL(raw, lookup = dns.lookup) {
  const u = new URL(raw);
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new Error('unsafe-url');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host) ? [{address: host}] : await lookup(host, {all: true});
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('unsafe-address');
  return u;
}

function requester(token = '', transport = fetch) {
  const hosts = new Map();
  return async function request(raw) {
    let url = raw;
    for (let hop = 0; hop < 6; hop++) {
      const u = await publicURL(url);
      const slot = Math.max(Date.now(), hosts.get(u.hostname) || 0);
      hosts.set(u.hostname, slot + (u.hostname === 'arxiv.org' ? 3500 : 500));
      await sleep(Math.max(0, slot - Date.now()));
      const headers = {'User-Agent': 'Academic-Misconduct-Marker-source-monitor/1.0', Accept: 'text/html,application/json,application/pdf;q=0.8'};
      if (u.hostname === 'pub.orcid.org') headers.Accept = 'application/json';
      if (u.hostname === 'api.github.com') {
        headers.Accept = 'application/vnd.github+json';
        headers['X-GitHub-Api-Version'] = '2022-11-28';
        if (token) headers.Authorization = 'Bearer ' + token;
      }
      const response = await transport(u.href, {headers, redirect: 'manual', signal: AbortSignal.timeout(15000)});
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) throw new Error('redirect-without-location');
        url = new URL(location, u).href;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error('http-' + response.status);
      }
      if (Number(response.headers.get('content-length')) > MAX_BYTES) {
        await response.body?.cancel();
        throw new Error('response-too-large');
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_BYTES) throw new Error('response-too-large');
        chunks.push(chunk);
      }
      return {body: Buffer.concat(chunks), type: response.headers.get('content-type') || '', link: response.headers.get('link') || ''};
    }
    throw new Error('too-many-redirects');
  };
}

function selectedJSON(kind, value) {
  if (kind === 'github-profile') return Object.fromEntries(['id', 'login', 'name', 'company', 'blog', 'bio'].map(k => [k, value[k]]));
  if (kind === 'github-commits') return value.map(v => ({sha: v.sha}));
  if (kind === 'github-releases') return value.map(v => ({id: v.id, tag: v.tag_name, body: v.body, published: v.published_at, assets: v.assets.map(a => ({id: a.id, name: a.name, size: a.size, updated: a.updated_at, digest: a.digest}))}));
  if (kind === 'github-issues' || kind === 'github-issue') {
    const selected = v => ({id: v.id, number: v.number, title: v.title, body: v.body, state: v.state, updated: v.updated_at, comments: v.comments});
    return Array.isArray(value) ? value.map(selected).sort((a, b) => a.id - b.id) : selected(value);
  }
  if (kind === 'github-comments') return value.map(v => ({id: v.id, body: v.body, updated: v.updated_at}));
  if (kind === 'crossref') return Object.fromEntries(['DOI', 'title', 'author', 'published', 'relation', 'update-to', 'link'].map(k => [k, value.message[k]]));
  return value;
}

function fingerprint(source, responses) {
  const first = responses[0];
  if (source.kind.startsWith('github-') || ['orcid', 'crossref'].includes(source.kind)) {
    const values = responses.map(r => JSON.parse(r.body.toString()));
    const value = Array.isArray(values[0]) ? values.flat() : values[0];
    const selected = selectedJSON(source.kind, value);
    return {hash: hash(json(selected)), hint: source.kind === 'github-commits' ? 'Default-branch commit ' + (value[0]?.sha || 'none') : 'Public metadata: ' + source.kind};
  }
  if (first.type.includes('pdf') || first.body.subarray(0, 5).toString() === '%PDF-') {
    return {hash: hash(first.body), hint: 'PDF bytes: ' + first.body.length};
  }
  const {document} = parseHTML(first.body.toString());
  const title = clean(document.querySelector('title')?.textContent);
  if (/just a moment|access denied|captcha|sign in|log in|security check|are you a robot/i.test(title) ||
      /unusual traffic from your computer network|verify you are human|enable javascript and cookies to continue/i.test(document.body?.textContent || '')) throw new Error('access-challenge');
  document.querySelectorAll('script,style,noscript,nav,footer,header,form,iframe').forEach(n => n.remove());
  const candidates = source.kind === 'arxiv' ? [document.querySelector('.leftcolumn')] :
    [document.querySelector('main'), document.querySelector('article'), document.body, document.documentElement];
  // Older academic homepages sometimes omit body tags; keep their visible text and links.
  const root = candidates.find(node => node && clean(node.textContent).length >= 40);
  if (!root) throw new Error('unreadable-page');
  const links = [...root.querySelectorAll('a[href]')].map(n => {
    try { const u = new URL(n.getAttribute('href'), source.url); u.hash = ''; return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
  }).filter(Boolean).sort();
  return {hash: hash(json({text: clean(root.textContent), links: [...new Set(links)]})), hint: source.kind === 'arxiv' ? clean(root.querySelector('.dateline')?.textContent) || 'arXiv abstract and submission history' : 'Page text and links'};
}

async function observe(source, request) {
  const responses = [];
  let url = source.requestUrl;
  for (let page = 0; page < 20; page++) {
    const response = await request(url);
    responses.push(response);
    // Only paginate the specifically cited discussion; repository feeds cover the latest 100 entries.
    const next = source.kind === 'github-comments' && response.link.match(/<([^>]+)>;\s*rel="next"/);
    if (!next) return fingerprint(source, responses);
    const nextURL = new URL(next[1]);
    if (nextURL.origin !== 'https://api.github.com' || nextURL.pathname !== new URL(source.requestUrl).pathname) throw new Error('unsafe-pagination');
    url = nextURL.href;
  }
  throw new Error('pagination-limit');
}

async function scan(sources, previous, reviewed, request, now = new Date().toISOString()) {
  if (previous && previous.schemaVersion !== SCHEMA) throw new Error('Unsupported monitor snapshot');
  if (!Array.isArray(reviewed) || reviewed.some(id => !/^[a-f0-9]{64}$/.test(id))) throw new Error('Reviewed event IDs must be SHA-256 strings');
  const acknowledgments = new Set(reviewed);
  const records = {}, failures = [];
  const active = new Set(sources.map(s => s.key));
  const pending = new Map((previous?.pending || []).filter(e => active.has(e.key) && !acknowledgments.has(e.id)).map(e => [e.id, e]));
  let cursor = 0, changed = 0, baseline = 0, unchanged = 0;
  await Promise.all(Array.from({length: 4}, async () => {
    while (cursor < sources.length) {
      const source = sources[cursor++];
      const old = previous?.records[source.key];
      try {
        const current = await observe(source, request);
        records[source.key] = {...current, checkedAt: now};
        if (!old) {
          baseline++;
          if (previous) {
            const id = hash(source.key + '\nfirst-observation\n' + current.hash);
            if (!acknowledgments.has(id)) pending.set(id, {id, key: source.key, url: source.url, kind: source.kind, paperIds: source.paperIds, identityIds: source.identityIds, firstSeen: now, before: {hash: 'none', hint: 'No successful prior observation'}, after: records[source.key]});
          }
        }
        else if (current.hash === old.hash) unchanged++;
        else {
          changed++;
          const id = hash(source.key + '\n' + old.hash + '\n' + current.hash);
          if (!acknowledgments.has(id)) pending.set(id, {id, key: source.key, url: source.url, kind: source.kind, paperIds: source.paperIds, identityIds: source.identityIds, firstSeen: now, before: old, after: records[source.key]});
        }
      } catch (error) {
        // Keep the last successful fingerprint through outages, rate limits and access challenges.
        if (old) records[source.key] = old;
        const reason = /^(http-\d+|unsafe-[a-z-]+|response-too-large|redirect-without-location|too-many-redirects|access-challenge|unreadable-page|pagination-limit)$/.test(error.message) ? error.message : 'network-or-format-error';
        failures.push({url: source.url, kind: source.kind, paperIds: source.paperIds, identityIds: source.identityIds, reason});
      }
    }
  }));
  const ordered = object => Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
  return {schemaVersion: SCHEMA, checkedAt: now, baselineOnly: !previous, counts: {sources: sources.length, baseline, changed, unchanged, unavailable: failures.length}, records: ordered(records), pending: [...pending.values()].sort((a, b) => a.firstSeen.localeCompare(b.firstSeen) || a.key.localeCompare(b.key)), failures: failures.sort((a, b) => a.url.localeCompare(b.url))};
}

const escape = text => String(text).replace(/[&<>"'`*_[\]\\|]/g, c => '&#' + c.charCodeAt(0) + ';').replace(/[\r\n]+/g, ' ');
function report(snapshot, data, inventory, limit = Infinity) {
  const c = snapshot.counts;
  const papers = new Map(inventory.papers.map(p => [p.id, p.title]));
  const identities = new Map(data.identities.map(i => [i.id, i.name]));
  const related = e => [
    'Papers: ' + (e.paperIds.map(id => escape(papers.get(id) || id) + ' (' + escape(id) + ')').join('; ') || 'publication inventory'),
    'Identity records to recheck: ' + (e.identityIds.map(id => escape(identities.get(id) || id)).join('; ') || 'none')
  ];
  const lines = ['# Weekly source review', '', 'Checked: ' + snapshot.checkedAt, '',
    `${c.sources} sources: ${c.changed} changed, ${c.unchanged} unchanged, ${c.baseline} new baselines, ${c.unavailable} unavailable.`, '',
    `${snapshot.pending.length} pending review items.`, '',
    snapshot.baselineOnly ? 'Initial baseline: no earlier snapshot was available for comparison.' : 'Comparison uses each source\'s last successful check.', '',
    'Source changes are review candidates. The evidence database and identity verification statuses are updated after review.', '', '## Pending review', ''];
  for (const event of snapshot.pending.slice(0, limit)) lines.push(
    `### ${escape(event.kind)}: [source](<${event.url}>)`, '',
    ...related(event), '', 'First detected: ' + event.firstSeen, '',
    '- Before: ' + escape(event.before.hint) + ' (`' + event.before.hash + '`)',
    '- After: ' + escape(event.after.hint) + ' (`' + event.after.hash + '`)', '',
    'Review ID: `' + event.id + '`', '');
  if (!snapshot.pending.length) lines.push('No pending changes.', '');
  if (snapshot.pending.length > limit) lines.push('More pending items are included in review.md in the source-review artifact.', '');
  lines.push('## Sources requiring a manual check', '');
  for (const failure of snapshot.failures.slice(0, limit)) lines.push(`- [${escape(failure.kind)}](<${failure.url}>): ${escape(failure.reason)}. ${related(failure).join('. ')}`);
  if (!snapshot.failures.length) lines.push('All monitored sources were accessible.');
  if (snapshot.failures.length > limit) lines.push('', 'More inaccessible sources are included in review.md in the source-review artifact.');
  return lines.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
  const output = option('--output', 'dist/source-monitor');
  const previousFile = option('--previous', '');
  const data = JSON.parse(fs.readFileSync('evidence-database/database.json'));
  const inventory = JSON.parse(fs.readFileSync('evidence-database/publication-inventory.json'));
  const reviewed = JSON.parse(fs.readFileSync('monitoring/reviewed.json'));
  const sources = collectSources(data, inventory);
  if (args.includes('--list')) return console.log(json(sources));
  // A requested but unreadable baseline is a failure, never a silent reset.
  const previous = previousFile ? JSON.parse(fs.readFileSync(previousFile)) : null;
  const snapshot = await scan(sources, previous, reviewed, requester(process.env.GH_TOKEN));
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, 'snapshot.json'), json(snapshot));
  fs.writeFileSync(path.join(output, 'review.md'), report(snapshot, data, inventory));
  fs.writeFileSync(path.join(output, 'summary.md'), report(snapshot, data, inventory, 30));
  console.log(json({checkedAt: snapshot.checkedAt, ...snapshot.counts, pending: snapshot.pending.length}));
  // Preserve the report for upload, but make a complete outage visible as a failed run.
  if (snapshot.counts.unavailable === sources.length) process.exitCode = 1;
}

module.exports = {collectSources, publicAddress, publicURL, requester, fingerprint, observe, scan, report};
if (require.main === module) main().catch(() => {console.error('Source monitor failed; no database changes were made.'); process.exitCode = 1;});
