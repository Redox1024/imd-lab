# IMD Lab

**Integrated Materials and Devices Laboratory**

An editable, English-language academic laboratory website for materials design, electrochemistry and integrated devices. It is ready for GitHub Pages and uses static HTML, CSS and JavaScript.

## This version

- All main menu pages share the header’s content width and left edge, consistent page-top spacing and heading margins. The public document reserves scrollbar space, and active navigation labels keep the same font weight so page changes do not shift the menu.

- Desktop header type is sized for normal browser zoom: a 44 px lab wordmark, 17 px full name and 18 px navigation, with matching symbol and spacing. Narrower screens reflow the menu into rows.

- The home layout places the lab identity above a full-width navigation row, then pairs the introduction on the left with a near-square research image on the right. The original portrait is preserved; the display crop keeps the hands and specimen in focus. The photograph-style illustration is identified as AI-generated and can be replaced in **Home images → Image**. Three shortcuts stay on one line with aligned labels and small top-right arrows; **Explore Research** does not wrap and the third label is **Publication**. The former Materials / Processing / Batteries strip is removed.
- The hero rotates through five images: microscopy, battery-cell research, electrode processing, solid-state battery manufacturing and aqueous rechargeable battery research every six seconds. Visitors can select an image or pause the rotation. Hover, keyboard focus and a hidden browser tab pause playback; reduced-motion preferences start it paused. Edit all five photos and their captions together under **Home images**, including the first. Add, remove, reorder or hide any photo in the same list. Rotation settings remain under **Home intro**. Older content downloads automatically move the former first photo into this list when imported.
- The supplied **IMD guide** logo is the initial choice. The supplied symbol sits to the left of an editable, regular-weight Space Grotesk wordmark styled after the user’s reference image. The supplied symbol is also the favicon. Choose another under **Lab settings → Logo design**, upload a **Custom logo image**, or select **None**. The Short name field updates the visible wordmark. Original supplied lockups remain available as assets. Earlier four logo proposals remain available. Assets are in `dist/assets/logos`.
- A bright, two-column introduction adapted from the earlier MEO layout, retaining the IMD Lab identity. The three home links share one horizontal row and remain transparent and turn lime on hover or keyboard focus.
- Exactly three preview sections below the introduction: **Research → News → Publications**, with up to three recent records in each. Each recent item opens its corresponding main Research, News or Publications page. No additional overview, people, patent, PI, contact or home-note sections are shown there.
- The About page begins with the PI’s current position, brief biography, email, telephone and Google Scholar profile. Research Experience, Education, Honors & Awards and Selected Publications follow in that order on one continuous page.
- A portrait area is always available at the top of About. Add the real PI photograph in **Professor → Profile image**.
- **Members** contains separate Current Members and Alumni groups, controlled by each person’s Membership field.
- **Cover gallery** adds editable cover images above the paper list: five per desktop row, ten per page. The ten included artworks are fictional concept covers. New covers are sorted by year and paginate automatically; Move up/down controls the order within a year.
- Choose **Papers → Show in PI selected publications** to manage the About page’s publication list. Entries share the publication data and article links; there is no second bibliography to maintain.
- A compact light footer contains the lab name, address, email, ETRI text link and copyright. It uses no institutional logo.
- The ETRI headquarters address is sourced from the official website. The lab building, room, PI telephone and personal Scholar URL have not been supplied; enter them when available. Unknown PI contacts show a neutral placeholder rather than a fabricated link.
- **Join Us** follows News and shows Open Positions and How to Apply together, without additional tabs. Individual positions support Open, Upcoming and Closed status, visibility and example flags.
- **Contact** shows email, telephone, address, directions, visiting notes and collaboration guidance on one continuous page, without submenus.
- All visible website and editor text remains English. Events stay out of the main menu; seminars and gatherings are managed through News.

All example people, affiliations, achievements and contact details are fictional. Replace the examples and clear their **Mark as an example** flags before presenting them as real information.

## Edit content

1. Open **Edit content** in the website footer.
2. Choose a section and edit its fields. The editor uses **Previous / Next** for long forms; the public pages are continuous.
3. Choose **Preview**, then **Download JSON**.
4. Replace `dist/data/content.json` in your GitHub repository and commit the change.

The editor prepares a local draft. It does not automatically save, commit or publish changes. Download the JSON before closing the tab.

| Section | Editable content |
| --- | --- |
| Lab settings | Logo selection/custom upload, lab name, abbreviation, About heading, institutional name/link, GitHub settings |
| Home intro | Intro text, three links, rotation speed and autoplay, news visibility |
| Home images | All rotating images including the first, captions, visibility and order |
| Archived home notes | Earlier notes retained for compatibility; not displayed in the current home layout |
| Navigation | Menu names, destinations, order and visibility |
| Extra pages | Additional pages that can be linked from Navigation |
| Professor | Name, current position, biography, photo, research experience, education, awards, email, telephone and Google Scholar |
| Research / Members | Research records, current members and alumni |
| Cover gallery | Images, cover titles, journal / collection, year, article URL and visibility |
| Papers / Journal IF | Manual or PDF-assisted papers, linked metrics and selection for the PI profile |
| Patents | Manual or certificate-assisted patent records |
| News | Lab announcements, publications, milestones, seminars and gatherings |
| Join Us / Open positions | Page introduction, application guidance, email and editable opportunity listings |
| Contact | Email, address, directions and collaboration information |

Academic history fields use one entry per line: `2013–2017 | Ph.D., Materials Science | Example University`. Ordinary text lines are also accepted.

Home news is sorted by date. Papers are sorted by year, with newly appended records shown first within the same year. Patent records are sorted by date. Research previews use Last updated, with newer entries first when dates are equal or absent. The full lists remain available from each section.

## Images

Use **Choose image** next to an image field to upload PNG, JPEG, WebP, AVIF or GIF files up to 1 MB. Uploaded images are included in the downloaded JSON, with a 20 MB total content limit. For larger collections, add optimized images to `dist/assets` and enter paths such as `assets/professor.webp`, or use public HTTPS image URLs.

The PI photograph, home image, member photographs and each cover image are independently editable. In Cover gallery, choose **Full image** for your own cover; numbered artwork options apply only to the included concept sheet. Add a verified Article URL to make a cover clickable.

The included home and cover images are illustrations, not experimental evidence. The PI photo is optional; the top summary remains complete without one.

## Papers, patents and IF

Use **Upload paper PDF** or **Direct entry** for papers, and **Upload certificate** or **Direct entry** for patents. Review the extracted fields before publishing. The downloaded website supports PDF processing; the conversation preview supports list navigation and manual editing.

IF is a separately verified journal metric. No licensed Clarivate credential is connected in this template. Unknown metrics appear as `IF —`. See [UPLOAD-GUIDE.md](UPLOAD-GUIDE.md) for manual entry, CSV import and optional licensed refresh.

## Publish and validate

Follow [GITHUB-START.md](GITHUB-START.md) to publish with GitHub Pages. Upload the complete project, including `.github/workflows/pages.yml`; the workflow publishes `dist`.

Run `npm run validate` to check syntax, content and required assets. There is no dependency installation or build step for the static website.

The vendored PDF.js and Tesseract license files are included in `dist/vendor`. Imported documents are processed in the browser; original files are not added to the website automatically.

Artwork and institutional address sources are recorded in [ASSET-SOURCES.md](ASSET-SOURCES.md).
