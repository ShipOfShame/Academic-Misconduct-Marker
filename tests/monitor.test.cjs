const {test} = require('node:test');
const assert = require('node:assert/strict');
const {collectSources, publicAddress, publicURL, fingerprint, observe, scan, report} = require('../scripts/monitor-sources.cjs');
const data = require('../evidence-database/database.json');
const inventory = require('../evidence-database/publication-inventory.json');
const page = {key: 'page:https://example.org/', url: 'https://example.org/', requestUrl: 'https://example.org/', kind: 'page', paperIds: [inventory.papers[0].id], identityIds: [data.identities[0].id]};
const response = body => ({body: Buffer.from(body), type: 'text/html', link: ''});
const html = content => '<html><head><title>Research</title></head><body><main>This is the public publication list for this researcher. ' + content + '</main></body></html>';
const request = content => async () => response(html(content));

test('source coverage includes the full inventory, every identity, and live repository state', () => {
  const sources = collectSources(data, inventory);
  assert.equal(new Set(sources.map(s => s.key)).size, sources.length);
  for (const paper of inventory.papers) assert.ok(sources.some(s => s.paperIds.includes(paper.id) && !/v\d+$/.test(s.url)));
  assert.ok(sources.filter(s => s.kind === 'arxiv').every(s => /^https:\/\/arxiv.org\/abs\/\d{4}\.\d{4,5}$/.test(s.url)));
  for (const identity of data.identities) assert.ok(sources.some(s => s.identityIds.includes(identity.id)));
  assert.ok(sources.some(s => s.kind === 'github-commits' && s.requestUrl === 'https://api.github.com/repos/Ironieser/TimesCLIP/commits?per_page=1'));
  assert.ok(sources.some(s => s.kind === 'github-comments' && s.url.endsWith('/TimesCLIP/issues/1')));
  assert.ok(sources.some(s => s.kind === 'orcid' && s.requestUrl.includes('pub.orcid.org')));
  assert.ok(!sources.some(s => s.requestUrl.includes('ShipOfShame')));
});

test('a baseline creates no allegation; later changes persist until explicitly reviewed', async () => {
  const first = await scan([page], null, [], request('Original contents'), '2026-01-01T00:00:00Z');
  assert.equal(first.counts.baseline, 1); assert.equal(first.pending.length, 0);
  const second = await scan([page], first, [], request('Revised contents'), '2026-01-08T00:00:00Z');
  assert.equal(second.counts.changed, 1); assert.equal(second.pending.length, 1);
  assert.deepEqual(second.pending[0].identityIds, page.identityIds);
  const third = await scan([page], second, [], request('Revised contents'));
  assert.equal(third.counts.unchanged, 1); assert.equal(third.pending.length, 1);
  const reviewed = await scan([page], third, [third.pending[0].id], request('Revised contents'));
  assert.equal(reviewed.pending.length, 0);
  const next = await scan([page], reviewed, [third.pending[0].id], request('Another revision'));
  assert.equal(next.pending.length, 1);
  assert.notEqual(next.pending[0].id, third.pending[0].id);
  const text = report(second, data, inventory);
  assert.ok(text.includes(inventory.papers[0].title));
  assert.ok(text.includes('Sixun Dong')); assert.ok(!text.includes('Revised contents'));
});

test('outages and CAPTCHA pages retain the baseline and pending reviews', async () => {
  const first = await scan([page], null, [], request('First'));
  const changed = await scan([page], first, [], request('Second'));
  const failed = await scan([page], changed, [], async () => {throw new Error('http-429');});
  assert.deepEqual(failed.records, changed.records);
  assert.deepEqual(failed.pending, changed.pending);
  assert.equal(failed.counts.changed, 0); assert.equal(failed.failures[0].reason, 'http-429');
  const challenge = await scan([page], failed, [], async () => response('<html><head><title>Just a moment...</title></head><body>Verify you are human</body></html>'));
  assert.equal(challenge.failures[0].reason, 'access-challenge');
  assert.deepEqual(challenge.records, changed.records);
  const recovered = await scan([page], challenge, [], request('Third'));
  assert.equal(recovered.counts.changed, 1); assert.equal(recovered.pending.length, 2);
});

test('previously unavailable and newly added sources enter the review queue when first readable', async () => {
  const first = await scan([page], null, [], async () => {throw new Error('http-503');});
  assert.equal(first.pending.length, 0);
  const recovered = await scan([page], first, [], request('Public contents'));
  assert.equal(recovered.counts.baseline, 1); assert.equal(recovered.pending.length, 1);
  assert.equal(recovered.pending[0].before.hash, 'none');
  const retired = await scan([], recovered, [], request('Public contents'));
  assert.equal(retired.pending.length, 0); assert.deepEqual(retired.records, {});
});

test('HTML noise is ignored while changed source links are detected', () => {
  const base = html('<a href="https://example.org/paper-one">Paper</a>');
  const noisy = base.replace('</head>', '<script>randomTimestamp=42</script><style>.random{color:red}</style></head>');
  assert.equal(fingerprint(page, [response(base)]).hash, fingerprint(page, [response(noisy)]).hash);
  assert.notEqual(fingerprint(page, [response(base)]).hash, fingerprint(page, [response(base.replace('paper-one', 'paper-two'))]).hash);
  const oldPage = '<html><head><title>Research profile</title></head><h1>Research publications and associated public academic records</h1><a href="https://example.org/profile">Profile</a></html>';
  assert.match(fingerprint(page, [response(oldPage)]).hash, /^[a-f0-9]{64}$/);
});

test('GitHub comment pagination detects edits beyond the first page', async () => {
  const source = {...page, kind: 'github-comments', requestUrl: 'https://api.github.com/repos/example/project/issues/1/comments?per_page=100'};
  let calls = 0;
  const read = async url => {
    calls++;
    return {body: Buffer.from(JSON.stringify([{id: calls, body: 'Author reply ' + calls, updated_at: '2026-01-01'}])), type: 'application/json', link: calls === 1 ? '<' + source.requestUrl + '&page=2>; rel="next"' : ''};
  };
  const result = await observe(source, read);
  assert.equal(calls, 2); assert.match(result.hash, /^[a-f0-9]{64}$/);
  await assert.rejects(observe(source, async () => ({...response('[]'), link: '<https://example.org/private>; rel="next"'})), /unsafe-pagination/);
});

test('private destinations are rejected, including redirect destinations and DNS answers', async () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fd00::1']) assert.equal(publicAddress(address), false);
  assert.equal(publicAddress('8.8.8.8'), true);
  assert.equal(publicAddress('2606:4700:4700::1111'), true);
  for (const url of ['http://example.org', 'https://127.0.0.1', 'https://user:pass@example.org', 'https://example.org:8080']) await assert.rejects(publicURL(url));
  await assert.rejects(publicURL('https://example.org', async () => [{address: '127.0.0.1'}]));
});

test('monitoring does not mutate canonical records, and invalid state cannot silently reset', async () => {
  const before = JSON.stringify({data, inventory});
  collectSources(data, inventory);
  await scan([page], null, [], request('First'));
  assert.equal(JSON.stringify({data, inventory}), before);
  await assert.rejects(scan([page], {schemaVersion: 99}, [], request('First')), /Unsupported/);
  await assert.rejects(scan([page], null, ['invalid'], request('First')), /SHA-256/);
});
