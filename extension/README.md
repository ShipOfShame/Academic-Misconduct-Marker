# Academic Misconduct Marker — Extension

## Installation

Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**. Select this folder, which contains `manifest.json`. Refresh arXiv or Google Scholar afterward.

To update, replace the extension files, click **Reload** in the extension manager, and refresh the page. Custom imported evidence is preserved. Export it before using **Restore bundled evidence** if you want the release dataset instead.

## Usage

Hover or keyboard-focus an author icon to see a concise role description, paper links, and evidence links. Escape dismisses the hover card. Click the icon for the full identity audit and paper findings. Popup controls disable markers or hide coauthors; the options page imports, exports, and restores evidence.

Red identifies a review subject, orange a recorded coauthor relationship, and gray an uncertain/conflicting match. None is an adjudication of personal misconduct. Each paper finding retains its own scope and status.

## Supported pages

arXiv abstract, HTML, search and list pages; Google Scholar search and profile pages on the .com, .com.hk, .co.uk and .com.au domains. Layout changes can require updates. PDF viewer annotation is not supported.

## Data

The bundled JSON contains only papers with documented open issues. Details identify the reviewed material, observation, reason for flagging, limits, and exact source locations. Corrected findings are excluded from the active database. The bundled JSON is generated from the repository database. Optional HTTPS `evidenceUrl` fields link to repository records; missing URLs fall back to this extension's paper-specific evidence page. There is no remote code or automatic dataset update.

Only Chrome local storage is requested. The extension scans supported page author/title areas locally, adds markers, and stores user settings and imported evidence locally. It does not send browsing contents to a server. Opening a source link follows normal browser navigation.
