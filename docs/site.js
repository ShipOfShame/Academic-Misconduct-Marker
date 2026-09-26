/* All evidence text is rendered as text, never HTML. */
(async function () {
  'use strict';
  const R = globalThis.ReviewPriority, E = globalThis.ScholarEvidence, L = globalThis.SiteLocale;
  const t = (key, values={}) => L.strings[key].replace(/\{(\w+)\}/g, (_,name)=>String(values[name]));
  const findingLabel = key => L.labels[key] || R.labels[key];
  const $ = id => document.getElementById(id);
  function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
  function link(text, url) { const a = el('a', text); if (/^https:\/\//.test(url) || /^#paper-[0-9.]+$/.test(url)) a.href = url; return a; }
  let data, settings = {...R.defaults};
  for (const [key, label] of Object.entries(L.labels).filter(([key])=>E.openIssueStatuses.includes(key))) { const option = el('option', label); option.value = key; $('status').append(option); }
  for (const [key, value] of Object.entries(settings)) {
    const label = el('label', findingLabel(key)), input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = '5'; input.step = '1'; input.value = value; input.id = 'weight-' + key;
    input.addEventListener('change', () => { settings = R.weights({...settings, [key]: input.value === '' ? NaN : Number(input.value)}); input.value = settings[key]; render(); });
    label.append(input); $('weights').append(label);
  }
  function paperCard(p) {
    const score = R.score(p, settings), card = el('article', undefined, 'paper'); card.id = 'paper-' + p.id;
    const point = el('div', undefined, 'score' + (score.points === 0 ? ' zero' : ''));
    point.setAttribute('aria-label', t('scoreAria',score));
    point.append(el('div', String(score.points), 'points'), el('span', '/ ' + score.maximum, 'scale'), el('small', t('priority')));
    const body = el('div'), meta = el('div', undefined, 'paper-meta');
    meta.append(link('arXiv:' + p.id, p.url), el('span', t('checked',{date:R.latest(p)})));
    const title = el('h3'); title.append(link(p.title, p.url));
    const tags = el('div', undefined, 'tags');
    for (const status of new Set(p.findings.map(f => f.status))) tags.append(el('span', findingLabel(status), 'tag ' + status));
    const details = el('details'), summary = el('summary', t(p.findings.length===1?'detailsOne':'details',{count:p.findings.length}));
    details.open = true;
    details.append(summary);
    for (const f of p.findings) {
      const finding = el('section', undefined, 'finding');
      finding.append(el('h4', f.title), el('p', findingLabel(f.status) + ' · ' + t('checked',{date:f.checked}), 'small'), el('p', f.detail));
      for (const section of E.findingSections(f)) finding.append(el('h5', L.sections[section.label] || section.label), el('p', section.text));
      finding.append(el('h5', t('sources')));
      for (const source of f.evidence?.sources || [{label:t('originalSource'),url:f.url,location:''}]) { const item=el('p',undefined,'source-item'); item.append(link(source.label+' ↗',source.url),el('span',source.location,'source-location')); finding.append(item); }
      details.append(finding);
    }
    const links = el('div', undefined, 'record-links');
    links.append(link(t('repository'), p.evidenceUrl));
    body.append(meta, title, el('p', p.authors.join(' · '), 'authors'), tags, details, links); card.append(point, body); return card;
  }
  function render() {
    if (!data) return;
    const selected = R.select(data.papers, {query: $('search').value, status: $('status').value, sort: $('sort').value, settings});
    $('papers').replaceChildren(...selected.map(paperCard));
    $('result-status').textContent = t('results',{count:selected.length,total:data.papers.length});
    $('score-mode').textContent = Object.keys(settings).some(k => settings[k] !== R.defaults[k]) ? t('customWeights') : t('defaultWeights');
    if (!selected.length) { const empty = el('div', undefined, 'empty'), reset = el('button', t('clear'), 'reset-filters'); reset.type = 'button'; reset.addEventListener('click', () => { $('search').value = ''; $('status').value = ''; render(); $('search').focus(); }); empty.append(el('p', t('empty')), reset); $('papers').append(empty); }
  }
  function openHash() {
    if (!data) return;
    const id = location.hash.slice(1); if (!data.papers.some(p => 'paper-' + p.id === id)) return;
    $('search').value = ''; $('status').value = ''; render(); const card = $(id); card.querySelector('details').open = true; card.scrollIntoView({block: 'start'});
  }
  $('search').addEventListener('input', render); $('status').addEventListener('change', render); $('sort').addEventListener('change', render);
  $('reset').addEventListener('click', () => { settings = {...R.defaults}; for (const [key, value] of Object.entries(settings)) $('weight-' + key).value = value; render(); });
  window.addEventListener('hashchange', openHash);
  const languageSwitch=$('language-switch');
  if(languageSwitch){const base=languageSwitch.getAttribute('href');const update=()=>languageSwitch.href=base+location.hash;update();window.addEventListener('hashchange',update);}

  try {
    const dataUrl = new URL('data.json', document.baseURI);
    const version = document.querySelector('meta[name="evidence-version"]')?.content;
    if (version) dataUrl.searchParams.set('v', version);
    const response = await fetch(dataUrl.href); if (!response.ok) throw Error('Snapshot unavailable'); data = E.validate(await response.json());
    $('paper-count').textContent = data.papers.length; $('finding-count').textContent = data.papers.reduce((n, p) => n + p.findings.length, 0); $('identity-count').textContent = data.identities.length; $('snapshot').textContent = data.updated;
    render(); openHash();
  } catch (_) { $('result-status').textContent = t('loadError'); $('papers').replaceChildren(link(t('fallback'), 'https://github.com/ShipOfShame/Academic-Misconduct-Marker/tree/main/'+(L.locale==='zh-CN'?'docs/zh/papers':'evidence-database/papers'))); }
})();
