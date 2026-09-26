# Brand assets

The identity uses red and orange brackets around an attention mark. Page markers share the same bracket geometry: red for the review subject, orange for a verified coauthor matched to the page, and gray for an uncertain review-subject match.

## Files

| Asset | English | Chinese |
|---|---|---|
| README banner | [SVG](assets/banner-en.svg) | [SVG](assets/banner-zh-CN.svg) |
| Sharing image, 1200 × 630 | [PNG](assets/social-en.png) · [SVG](assets/social-en.svg) | [PNG](assets/social-zh-CN.png) · [SVG](assets/social-zh-CN.svg) |
| Compact wordmark | [SVG](assets/wordmark-en.svg) | [SVG](assets/wordmark-zh-CN.svg) |

[App icon](assets/icon-256.png) · [Review-subject marker](assets/marker-target.svg) · [Coauthor marker](assets/marker-coauthor.svg) · [Uncertain-match marker](assets/marker-candidate.svg)

## Palette and rendering

| Use | Color |
|---|---|
| Review-subject marker | `#b4232c` |
| Coauthor marker | `#b85108` |
| Uncertain-match marker | `#667078` |
| Text | `#211a1b` |
| Banner background | `#faf8f4` |

Keep the complete mark and its aspect ratio. The shapes distinguish roles alongside color. Banners and sharing images use descriptive text rather than review findings or author names.

## Regeneration

The vector geometry lives in [brand.js](../extension/brand.js); the covers and corpus badges come from [brand-assets.cjs](../scripts/brand-assets.cjs). Run `npm run icons` to regenerate vectors and PNG sizes, including the 16, 32, 48 and 128 pixel Chrome icons. Corpus badges are derived from the canonical database by `npm run generate`.

The README uses live [Shields.io](https://shields.io/) badges for repository license, latest release and stars. The local corpus badges describe the checked-in data. No CI status badge is displayed.
