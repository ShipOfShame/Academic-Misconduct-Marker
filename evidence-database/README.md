# Evidence database

`database.json` is the canonical active-issue catalogue. It contains only papers with at least one documented open reporting, implementation, or material-availability issue. Papers with only unresolved questions, no confirmed issue, or fully corrected findings are excluded. Corrected findings are removed, including those on papers with other open issues.

Every finding includes a summary plus structured evidence: reviewed material, observed evidence, reason for flagging, scope and author response, and source links with exact locations. Individual identity records include verification status and provenance; only identities attached to active papers remain. Identity verification and coauthorship do not establish misconduct.

Edit this canonical JSON and run `npm run generate`. The generator updates `extension/evidence.json`, `docs/data.json`, per-paper Markdown, the paper index, and the identity audit, and removes obsolete generated paper pages. Do not edit generated copies separately. Validation rejects papers that fail the inclusion rule or omit required evidence details.

Existing custom imports without the new inclusion-policy field remain readable for compatibility. They do not replace the publication rules for the bundled catalogue. The extension requires manual dataset or version updates; it does not pull changes automatically. Local research snapshots and personal contact data are not included.
