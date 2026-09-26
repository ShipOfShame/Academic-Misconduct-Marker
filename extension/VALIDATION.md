# Validation

Release 0.1.0 passed 45 unit, DOM, data, and publication checks and 12 browser checks. Validation covers the extension, evidence data, and published website.

- Data checks enforce paper and identity bindings, source links, translation consistency, and generated-file parity.
- Unit and DOM tests cover identity matching, conflicting identifiers, unverified coauthors, imported data, marker cleanup, and scoring.
- Browser tests cover extension injection, hover cards, keyboard access, settings, evidence navigation, bilingual pages, and narrow layouts using controlled fixtures.
- Publication checks reject local account paths, credentials, and image metadata. Release archives contain an explicit file allowlist with fixed timestamps.

Run `npm run check` and `npm run test:e2e` from the repository root. Browser fixtures verify application behavior; they do not reproduce research experiments.
