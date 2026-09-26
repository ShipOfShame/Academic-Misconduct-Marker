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

## Weekly source monitor

The [weekly workflow](https://github.com/ShipOfShame/Academic-Misconduct-Marker/actions/workflows/weekly-source-review.yml) runs on the default branch every Monday at 04:17 UTC. It also supports **Run workflow**. No AI API key or additional repository secret is required; its GitHub token has read-only contents and Actions permissions. It writes a run summary and a `source-review` artifact, not commits, database findings or author labels.

Sources come from the canonical findings, identity records and full publication inventory. arXiv links follow the current abstract and submission history, including when the recorded evidence cites an older version. GitHub checks follow default-branch commits, the latest 100 releases and updated issues or pull requests, plus all comments in specifically cited issues (up to 2,000 comments per issue). Public ORCID records and identity pages are included. Changes on publication-list pages can prompt a search for newly listed papers; the monitor does not attribute new papers or people automatically.

The monitor compares normalized page text and links, selected public API metadata, or PDF bytes. It does not download or execute research code, run experiments, interpret manuscript claims, or infer an identity from a name. Changes in page layout, metadata or unrelated repository activity can produce review candidates. JavaScript-only pages, access challenges, rate limits, timeouts, and responses above 4 MiB appear in the manual-check list. Their last successful fingerprints are preserved, so recovery can still reveal changes. A complete source outage fails the run after saving its report.

Each successful run restores the latest retained successful snapshot and its pending reviews. The initial run establishes a baseline; subsequently added or newly accessible sources enter the review list. Removing a source from the monitored inputs retires its pending items. Artifacts retain fingerprints and short revision hints, not fetched page bodies, PDF contents, personal environment metadata or credentials.

To process the queue:

1. Open the latest run summary, or download `source-review` for `review.md` and `snapshot.json`.
2. Check each changed source and any inaccessible source. Update findings, corrections and identity evidence where warranted, following the checklist above.
3. Add the completed item's 64-character **Review ID** to [monitoring/reviewed.json](../monitoring/reviewed.json). Submit it with the reviewed changes, or alone if no database change is needed. A later source revision receives a different review ID.
4. Regenerate and validate the published data before publishing reviewed changes. A monitoring run does not change any evidence review date.

Artifacts are retained for 90 days, subject to the repository retention limit. Keep a downloaded snapshot if monitoring is paused longer than that; an expired baseline requires a fresh initial comparison and cannot retain its pending queue. GitHub can delay scheduled runs and disables schedules in public repositories after 60 days without repository activity; re-enable the workflow from Actions when needed. See [GitHub scheduling behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [artifact retention](https://docs.github.com/en/actions/tutorials/store-and-share-data).

Local checks use `npm run test:monitor`. To inspect source coverage without network requests, run `npm run monitor -- --list`. Run `npm run monitor` for an initial check, or `npm run monitor -- --previous dist/previous-review/snapshot.json` to compare against a downloaded snapshot. Outputs go to `dist/source-monitor/` and stay outside the extension package and Pages data.

## Release

Use the root package manifest and lockfile for all development commands. The extension does not require a separate dependency installation.

Update root package and extension manifest versions together. Run `npm ci`, `npm run check`, `npm run test:e2e`, and `npm run package`. The `dist` directory contains an allowlisted ZIP and checksum. Only runtime assets, the license, and installation instructions enter the archive; tests and validation documentation stay in the repository. Archive timestamps and creator metadata are fixed. Publication validation rejects local account paths, private configuration files, and nonessential PNG metadata. Attach both to a GitHub release and record the exact validation scope. No signing or Chrome Web Store review is implied.

## GitHub Pages

The website is served from `main` at `/docs`. Update the canonical data, regenerate, validate, and run browser tests before pushing. Pages needs no custom CI workflow. A push changes the website after GitHub completes its managed Pages build; it does not update data inside already-installed extensions. The website scoring module and methodology must change together when scoring rules change.

## Language separation and brand assets

Keep factual English records in the canonical database and Chinese translations in `evidence-database/locales/zh-CN.json`. A translation must cover every active paper, finding, evidence section, and source label/location. Its source SHA-256 must match the English paper record; generation fails if it is stale. Recheck the translation before updating its fingerprint. Do not translate names, identifiers, code tokens, numbers, or URLs into different identities or claims.

Static page translations and runtime strings live in `locales/`. The English page source is `site/index.en.html`; generation writes both public language routes. Chinese Markdown evidence is generated in `docs/zh/papers/`. Keep Chinese documentation separate from the English README and method.

Brand geometry is defined in `extension/brand.js`. `npm run icons` regenerates SVG and PNG assets. The page-injected markers use those same paths. Inspect toolbar-size and page-size rendering after a design change.
