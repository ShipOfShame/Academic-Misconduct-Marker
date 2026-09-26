/* Review-priority points are editorial settings, not an estimate of misconduct. */
(function (root) {
  'use strict';
  const labels = Object.freeze({reporting_error: 'Reporting inconsistency', implementation_error: 'Implementation concern', material_gap: 'Material availability gap', needs_clarification: 'Needs clarification', corrected: 'Corrected', no_confirmed_issue: 'No confirmed issue'});
  const defaults = Object.freeze({reporting_error: 3, implementation_error: 3, material_gap: 2});
  function weights(input = {}) {
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key,
      typeof input[key] === 'number' && Number.isInteger(input[key]) && input[key] >= 0 && input[key] <= 5 ? input[key] : fallback]));
  }
  function score(paper, input) {
    const settings = weights(input);
    const statuses = new Set(paper.findings.map(f => f.status));
    const parts = Object.entries(settings).filter(([key]) => statuses.has(key)).map(([key, points]) => ({key, label: labels[key], points}));
    return {points: parts.reduce((n, p) => n + p.points, 0), maximum: Object.values(settings).reduce((a, b) => a + b, 0), parts};
  }
  function latest(paper) { return paper.findings.reduce((date, f) => f.checked > date ? f.checked : date, ''); }
  function select(papers, {query = '', status = '', sort = 'score', settings} = {}) {
    const needle = query.trim().toLowerCase();
    return papers.filter(p => [p.id, p.title, p.originalTitle || '', ...p.authors].join(' ').toLowerCase().includes(needle) && (!status || p.findings.some(f => f.status === status)))
      .slice().sort((a, b) => {
        const order = sort === 'title' ? a.title.localeCompare(b.title, 'en') : sort === 'checked' ? latest(b).localeCompare(latest(a)) : score(b, settings).points - score(a, settings).points;
        return order || a.id.localeCompare(b.id);
      });
  }
  const api = {labels, defaults, weights, score, latest, select};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReviewPriority = api;
})(globalThis);
