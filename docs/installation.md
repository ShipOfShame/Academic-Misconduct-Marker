# Installation and troubleshooting

## First installation

Download the ZIP attached to the latest GitHub release, extract it, open `chrome://extensions`, enable Developer mode, and load the `extension` folder. The folder must contain `manifest.json`; selecting its parent will fail. Keep this folder in a stable location. Refresh already-open pages after loading.

## Update or rollback

Export custom evidence from the options page before changing versions. Extract the chosen release into the installed folder, reload it in Chrome, and refresh the target page. To roll back, repeat with an older release. Imported data is preserved across extension file updates; **Restore bundled evidence** deliberately replaces it.

## No marker appears

Check that the extension is enabled, the page is an arXiv HTML page or a supported Scholar domain, and the author or paper is in the bundled/imported corpus. The extension does not mark arbitrary authors or annotate PDFs. Gray markers indicate uncertain identity; they are not failures to escalate someone to a review subject.

## A different person is marked

Use the popup to disable markers or hide coauthors while reporting the issue. Include the page URL, visible author name, Scholar/ORCID identifier if present, and the evidence record. Do not send private account data. Follow the identity-mismatch issue template.

## Evidence changed on GitHub but the extension still shows old text

GitHub links and bundled data have separate update cycles. Update the extension or explicitly import the new database after exporting a backup. Automatic remote synchronization is not implemented.

## Uninstall

Remove the extension in `chrome://extensions`. Chrome removes its extension-local settings. Keep an exported evidence file if you want to retain custom records.
