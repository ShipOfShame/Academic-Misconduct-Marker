# Evidence maintenance

## One source of truth

Edit `evidence-database/database.json`. Run `npm run generate` to update `extension/evidence.json`, per-paper Markdown, the paper index, the identity-audit report, and the GitHub Pages data snapshot. Generated files must not be edited independently. `npm run validate` checks that they agree.

The published database uses `inclusionPolicy: "documented-open-issues"`. Every paper must have an open reporting, implementation, or material-availability issue. Exclude clarification-only, no-issue, and fully corrected papers; remove their identity bindings and any orphan identities. Generation also removes their obsolete Markdown pages.

Each finding needs a structured `evidence` object containing `scope`, `observation`, `reason`, `limitation`, and a nonempty `sources` list of `{label, url, location}` records. Source locations should identify the relevant table, equation, comment, or file lines. Remove every corrected finding from the active database, including findings on papers with other open issues. Record subsequent corrections in version control. These requirements are enforced before publication.

Each finding also needs an allowed status, a precise title and explanation, an HTTPS original-source URL, and a review date. Identify the relevant paper version or commit in the explanation. Preserve acknowledgments, corrections, and counterevidence. A review date is a snapshot, not a guarantee of the current upstream state.

Identity records require an independent record ID, name, recorded-paper bindings, source URLs, date, status, and explanation. Import Scholar/ORCID identifiers only after establishing ownership through primary sources. Name-only candidates cannot carry automatic-match IDs. Historical affiliation is supporting context, not an identity certificate.

## Review checklist

The README case percentage uses `evidence-database/publication-inventory.json` as its dated denominator and the subject's active database records as its numerator. Keep the inventory date aligned with the reviewed database snapshot, reconcile the author homepage and complete Scholar list, and retain unreviewed publicly listed works in the denominator. `npm run generate` updates both READMEs and `docs/publication-coverage.md`; validation rejects duplicate inventory IDs and active papers missing from the inventory. The inventory is bibliography metadata and is not imported into the extension's issue database.

1. Verify the original source and record its version or commit where available.
2. Separate what is directly observed from interpretation and unresolved questions.
3. Check whether a correction or response supersedes the finding.
4. Keep coauthorship separate from personal responsibility.
5. Generate, validate, run unit and browser tests, then build the release ZIP.
6. Review the diff, publish the updated dataset, and describe meaningful changes in the changelog.

## Corrections

Use an issue or pull request specifying the paper ID or identity record and supporting source. A correction should update the original entry, including its review date and status; do not leave a contradicted allegation as a current finding. Document the corrected finding and its supporting source in the update. Questions without evidence remain questions, not verified claims.

## Release

Use the root package manifest and lockfile for all development commands. The extension does not require a separate dependency installation.

Update root package and extension manifest versions together. Run `npm ci`, `npm run check`, `npm run test:e2e`, and `npm run package`. The `dist` directory contains an allowlisted ZIP and checksum. Only runtime assets, the license, and installation instructions enter the archive; tests and validation documentation stay in the repository. Archive timestamps and creator metadata are fixed. Publication validation rejects local account paths, private configuration files, and nonessential PNG metadata. Attach both to a GitHub release and record the exact validation scope. No signing or Chrome Web Store review is implied.

## GitHub Pages

The website is served from `main` at `/docs`. Update the canonical data, regenerate, validate, and run browser tests before pushing. Pages needs no custom CI workflow. A push changes the website after GitHub completes its managed Pages build; it does not update data inside already-installed extensions. The website scoring module and methodology must change together when scoring rules change.

## Language separation and brand assets

Keep factual English records in the canonical database and Chinese translations in `evidence-database/locales/zh-CN.json`. A translation must cover every active paper, finding, evidence section, and source label/location. Its source SHA-256 must match the English paper record; generation fails if it is stale. Recheck the translation before updating its fingerprint. Do not translate names, identifiers, code tokens, numbers, or URLs into different identities or claims.

Static page translations and runtime strings live in `locales/`. The English page source is `site/index.en.html`; generation writes both public language routes. Chinese Markdown evidence is generated in `docs/zh/papers/`. Keep Chinese documentation separate from the English README and method.

Brand geometry is defined in `extension/brand.js`. `npm run icons` regenerates SVG and PNG assets. The page-injected markers use those same paths. Inspect toolbar-size and page-size rendering after a design change.
