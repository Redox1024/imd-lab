# Add papers and patents

## Research papers

1. Open **Edit content → Papers**.
2. Choose **Upload paper PDF** or **+ Direct entry**.
3. PDF import reads available title, author and DOI information, checks matching public Crossref metadata, and extracts or suggests up to three keywords.
4. Review every field, including **Import notes / review**. Fill missing journal, year and author information yourself when lookup is unavailable. Review author names rather than inventing translations.
5. Choose **Preview → Download JSON**, then replace `dist/data/content.json` on GitHub.

A paper entry displays its year, journal, IF with reference year, title, full author list and keywords. **View article** uses the publisher URL when available, or the DOI URL. Missing links remain disabled. The title opens the full details.

## Patents

Open **Patents → Upload certificate** and select a PDF, PNG, JPG or WEBP certificate, or choose **Direct entry**. Import extracts available title, inventors, application or registration numbers, dates and status. Korean and English OCR are supported. Check the extracted numbers and dates, and enter English public-facing titles and inventor names.

A registration certificate matching an existing application number updates that entry’s grant status, registration number and date. If a reliable match cannot be made, a new draft is added for review. This feature does not determine a patent’s legal validity.

## Journal IF

IF is a separately maintained Journal Impact Factor, not a value extracted from a paper PDF. Its reference year may differ from the paper’s publication year. The website always shows the metric’s reference year with the value.

Adding a paper creates or links a **Journal IF** record. Matching uses ISSN/eISSN when possible and otherwise an exact normalized journal name. Linked papers share the same verified metric. Unknown values display as `IF —`; they are not converted to zero.

### Manual entry or CSV

Enter the official value in **Journal IF**, or choose **CSV template → Import IF CSV**.

| Column | Content |
| --- | --- |
| name | Journal name |
| issn | ISSN and eISSN, separated by semicolons |
| impactFactor | Official IF value; `<0.1` is supported |
| metricYear | Metric reference year |
| metricSource | Official source URL |
| metricUpdated | Verification date, YYYY-MM-DD |

The CSV format is specific to this website. A verified metric requires its value, reference year, source URL and verification date. Older imported metrics do not overwrite more recent values.

### Optional licensed API refresh

No API credential is included or connected. If your institution’s Clarivate Journals API access and public display terms permit this use:

1. Add `CLARIVATE_API_KEY` under your GitHub repository’s **Settings → Secrets and variables → Actions → Secrets**.
2. Set the Actions variable `JCR_PUBLIC_DISPLAY_AUTHORIZED` to `true` when public display is authorized.
3. Run the deployment workflow.

The existing workflow then checks the latest available report during deployments and its monthly scheduled run. GitHub schedules may be delayed or disabled; run the workflow manually if necessary. A failed lookup retains the previously verified value and reference year. Suppressed or unavailable values are not presented as zero.

Refreshed data is included in that deployment. The workflow does not automatically commit the updated JSON to the source repository. Reopen the deployed site’s editor and download its content if you want to retain the latest deployed values in source.

## Processing and privacy

- Up to five files per import, 30 MB per file.
- Up to the first three pages of a paper or five pages of a certificate are processed.
- Scanned pages use OCR. The first run may need to download OCR components and language data. **Cancel import** stops processing.
- Original documents are processed in the browser and are not automatically uploaded to the repository or an analysis server. DOI lookups use public Crossref endpoints. PDF support files and OCR components may load from public CDNs.
- The JSON includes the editable records, import notes and a file hash; it does not contain the original document.
- The editor does not automatically save or publish. Download and review the JSON before uploading it to GitHub.

The conversation preview supports browsing and manual entry. Open the downloaded website through a local web server or GitHub Pages to use PDF and certificate analysis.

PDF.js 6.3.289 and Tesseract.js 6.0.1 are included with their license files in `dist/vendor`. The import verification script uses fixed metadata responses; actual API credentials and individual scan accuracy require the corresponding real inputs.
