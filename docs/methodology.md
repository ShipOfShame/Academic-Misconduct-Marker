# Methodology and review-priority scoring

Academic Misconduct Marker documents inspectable concerns about research reporting, implementation, and access to research materials. Its current corpus is a selected static-review snapshot, initially centered on Sixun Dong and the listed papers. It is not representative of a field, institution, or collaboration network. No research models or experiments were run for these records.

## What the references support

- **Pineau et al. (2021) — [Improving Reproducibility in Machine Learning Research (A Report from the NeurIPS 2019 Reproducibility Program)](https://jmlr.org/papers/v22/20-303.html)**. Code and experimental details should remain open to examination after publication. The NeurIPS program combined a code-submission policy, a reproducibility checklist and a community reproducibility challenge.

- **Dodge et al. (2019) — [Show Your Work: Improved Reporting of Experimental Results](https://aclanthology.org/D19-1224/)**. Model comparisons require more than a final test score. The study shows how validation results and hyperparameter-search budgets can change the conclusions drawn from a comparison.

- **Kapoor and Narayanan (2023) — [Leakage and the reproducibility crisis in machine-learning-based science](https://doi.org/10.1016/j.patter.2023.100804)**. Data separation needs inspection throughout preprocessing, model development and evaluation. The paper analyzes leakage and its effects on scientific claims based on machine-learning results.

- **Sandve et al. (2013) — [Ten Simple Rules for Reproducible Computational Research](https://doi.org/10.1371/journal.pcbi.1003285)**. Results should be traceable to inputs, software versions, parameters and analysis steps. This motivates our versioned source links and checks of reproduction materials.

- **ACM — [Artifact Review and Badging](https://www.acm.org/publications/policies/artifact-review-and-badging-current)**. Material availability, artifact functionality and independent validation of results are separate assessment dimensions. Our records identify which dimension a finding concerns.

- **COPE — [Core Practices — Post-publication discussions and corrections](https://publicationethics.org/core-practices)**. Journals should provide mechanisms for discussion after publication and for correcting the research record. Our source-linked findings and correction process follow this principle.

For each paper, the evidence record identifies the observation, reviewed version and original source. Author responses and corrections are assessed against that record.

## Admission to the active database

A paper must have at least one documented open reporting inconsistency, implementation issue, or material-availability gap. A generic methodological question, an unverified suspicion, or a record with no confirmed issue does not qualify. A paper with only corrected findings is also excluded. Every corrected finding is removed from the active database, including those on papers with other open issues.

The website and bundled extension contain only admitted papers. Identity records and paper bindings are restricted to the same active corpus. Removal from this catalogue does not certify a paper; it means the recorded evidence does not meet this catalogue's inclusion rule.

Every finding has a structured evidence record: reviewed material/version, observed evidence, reason for flagging, scope and author response, and source links with exact locations. Missing details fail publication validation. The website opens these details by default; extension paper panels and repository Markdown show the same content. These records explain specific evidence-backed issues, not an adjudication of personal misconduct.

## Scoring version 2

The website shows **paper review-priority points**, an editorial aid for deciding what to read first. It does not calculate a probability of misconduct, a measure of intent, or an author ranking.

| Finding type | Default points | Interpretation |
|---|---:|---|
| Reporting inconsistency | 3 | A recorded numerical, textual, or reporting discrepancy |
| Implementation concern | 3 | A recorded concern about released code or its correspondence to the paper |
| Material availability gap | 2 | A recorded limitation in access to promised or relevant artifacts |

For a paper, take the set of distinct finding types present and sum their weights. Count each type at most once. With defaults the range is 0-8, even if multiple findings share a type. A corrected finding is removed; other open findings on the same paper continue to contribute. Unknown statuses are rejected by database validation.

Readers may adjust the three open-type weights to integers from 0 to 5. Invalid inputs revert to that type's default. Changes last only in the current tab and do not modify the published database, extension, or anyone else's scores. The displayed maximum is the sum of the current three weights; setting all to zero disables priority distinctions. There are no hidden thresholds, personal multipliers, or author-position adjustments.

A zero score does not certify correctness. A higher score may reflect more categories of documented questions rather than more severe scientific consequences. The weights are not empirically calibrated, papers have not all received equivalent review effort, and snapshot dates do not imply ongoing monitoring. Score order is descending, with arXiv ID as a deterministic tie-breaker. Date sorting uses the latest finding check date, not publication date.

## Identity and responsibility

A paper byline confirms that a name appears on that paper; it does not resolve all same-name people. Curated identifiers, professional source chains, and explicit conflict checks govern person matching. See the [individual identity audit](identity-audit.md). Supported and unresolved coauthors receive no marker. Verified coauthors also require a matching current page.

The red marker denotes a recorded review subject with unconfirmed concerns. The orange marker denotes a coauthor relationship on a recorded paper. Coauthorship is not itself evidence of wrongdoing or of responsibility for a particular error. The site scores papers only.

## Evidence and corrections

Each finding records its status, description, primary-source link, and review date. Prefer immutable repository commits and specific paper versions. Where the underlying source or later acceptance status has not been verified, the record must say so. A source link is not an archived guarantee that a webpage will remain unchanged.

Submit a correction through the [evidence issue form](https://github.com/ShipOfShame/Academic-Misconduct-Marker/issues/new?template=evidence.md). Include the paper ID, challenged finding, exact version, supporting source, and proposed correction. Identity disputes use the [identity form](https://github.com/ShipOfShame/Academic-Misconduct-Marker/issues/new?template=identity.md). Maintainers should assess counterevidence, update the canonical record and check date, record subsequent corrections in version control, and regenerate public outputs. A repository entry is not an institutional or publisher finding.

## Website publication

GitHub Pages serves the committed `docs/` directory on the `main` branch. The website, extension snapshot, and Markdown records are generated from the same canonical database. No custom CI workflow is configured. Validation and browser tests run locally before publication. GitHub manages its own Pages build and hosting infrastructure.

The site has no analytics or third-party scripts. It fetches the committed snapshot from the same site. GitHub may process access logs under its own policies. Research sources are contacted only when a reader follows a link.
