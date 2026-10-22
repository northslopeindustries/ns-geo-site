# Editing the ns-geo.com website

## What this site is

The site for **North Slope Geotextiles** (North Slope Industries), a direct
importer and regional distributor of commercial-grade weed barrier fabric,
based in Springville, Utah. Main product is Pro Guard 20; the site also
covers sod staples and filter fabric.

The site is growing into a brand site with several audiences:

- **Wholesale buyers** — nurseries, garden centers, rock yards, and landscape
  supply yards who resell to their own customers. This is where the revenue
  is today, and the wholesale pricing form is how those leads arrive.
- **Contractors, homeowners, and DIY users** who want to understand the
  product, how to install it, and where to get it. Useful information for
  them is wanted.
- **Anyone learning about the brand** — who North Slope is and where they
  operate.

Write for whichever audience a section actually addresses, and keep sections
distinct. The failure mode is not "consumer content exists" — it is copy that
addresses everyone at once and so addresses nobody. Wholesale sections keep
talking about margins, minimum orders, fulfillment speed, and reselling.

The home page (`index.html`) is entirely wholesale-facing, so consumer and
brand material is new content rather than a rewrite. The FAQ page
(`faq.html`) is the first page written for a mixed audience: installation
and product questions for contractors and homeowners, then ordering
questions for distributors and contractors.

**Homeowners and DIY users never buy from North Slope.** North Slope sells
*to* distributors; they are the customers. Always point homeowners and DIY
users to the Find a Distributor page, never toward buying from North Slope.

**Contractors are different.** Landscape contractors can apply for a direct
account through the form on the For Contractors page, so pointing
contractors there is correct. **Never put contractor prices anywhere on the
site**, on the For Contractors page or anywhere else.

Until a page exists, mention it by name as plain text, never as a link.
(The FAQ answers still use the older names "Where to Buy" for Find a
Distributor and "Contractor Pricing" for For Contractors.)

Rewriting an existing wholesale section in consumer language is a strategy
decision. Do it when asked, and say plainly in the reply which wholesale
wording changed.

## Who you are working for

The person asking is not a developer. They describe what they want in plain
English. They cannot read code, cannot test anything, and cannot tell a
working page from a broken one by looking at a diff.

So:

- **Explain what you changed in plain language**, not by pointing at code.
  "Changed the phone number in the footer and in the form's error message"
  — not "updated line 412."
- **Never assume they will notice a mistake.** Nobody downstream is checking
  your work.
- If a request is ambiguous, ask. A wrong guess ships.
- If a request would require inventing a fact — a specification, price,
  dimension, lead time, warranty term, or performance claim — ask for the
  real number instead of supplying one.

This file is for Claude Code, which edits files directly. If someone instead
pastes a whole file into a chat window, the guidance for that is in
`docs/project-instructions.md`.

## How a change reaches the live site

1. You edit the files on a **branch** and open a **pull request**.
2. Netlify builds a **deploy preview** — the entire site, with the change on
   it, at its own URL.
3. The person who asked opens that URL and checks the page looks right.
4. If it does, they merge the PR.
5. Netlify builds `main`, runs `validate.py`, and publishes to ns-geo.com.

**Step 3 is the point of the whole arrangement.** Nothing reaches ns-geo.com
until a person has looked at the rendered page and chosen to merge. Your job
is to make that check easy, not to skip it.

### Always hand over the preview URL

You cannot see the rendered page. They can. So when you finish a change, end
your reply with the preview link and say what to look at:

```
https://deploy-preview-<PR number>--fascinating-concha-6dd60c.netlify.app
```

It also appears on the pull request itself as a "Deploy Preview ready!" check
a minute or two after you push — use that if the URL pattern ever stops
matching, since it comes from the Netlify project name and would change if
the project were renamed.

Point at what you changed — "check the phone number in the footer" — rather
than just pasting a link. And **never tell them a visual change looks
correct.** You have not seen it. Say what you changed and let them confirm.

**Always work on a branch and open a PR — never commit straight to `main`.**
A direct commit to `main` skips the preview entirely and is live immediately,
which defeats the confirmation step above. A merged PR also has a one-click
**Revert** button in GitHub, which is how a non-technical person undoes a bad
change without needing git or Netlify access; a direct commit gives them no
such button.

Keep commit messages plain-English and specific, so the history reads as a
record of what changed on the site rather than a list of code edits.

## Files

| File | Contains | Touch it for |
|---|---|---|
| `index.html` | Home page content and text (~32 KB) | Wording, headings, contact details, adding or removing content |
| `faq.html` | The FAQ page at ns-geo.com/faq | FAQ questions and answers |
| `products.html` | The Products page at ns-geo.com/products | Product boxes, the fabric comparison table |
| `styles.css` | All styling | Colors, spacing, fonts, sizes, layout |
| `script.js` | Scroll animations, counters, form submit | Rarely — behavior only |
| `menu.js` | Opens and closes the phone menu | Rarely — behavior only |
| `images/` | 9 image files | Swapping or adding photos |
| `validate.py` | The pre-deploy check | Only when the checks themselves need changing |
| `netlify.toml` | Hosting config and the deploy check | Rarely |
| `docs/` | Internal notes, not published | Documentation changes |

`index.html` is divided by comment markers named after what they visibly
are on the page — `HERO`, `PRODUCTS`, `CONTACT FORM`, `FOOTER`, and so on.
Use them to locate a section when someone says "the products section."
`faq.html` uses the same markers: `NAVIGATION`, `FAQ`, `FOOTER`.
`products.html` uses `NAVIGATION`, `PRODUCTS`, `FABRIC COMPARISON`,
`CTA BAND`, `FOOTER`.

The site is moving to multiple pages. There is no shared template, so the
navigation bar (including the phone menu inside it) and footer are copied
into every page. A change to any of them has to be made in every page file,
or the pages drift apart. Each FAQ question is a `<details>` element with
the question in `<summary>`; it opens and closes with no JavaScript.
`faq.html` and `products.html` load only `menu.js`, not `script.js`, so
they must not use the `fade-up` class (it stays invisible without
`script.js`).

The Pro Guard 20 box appears on both the home page and the Products page
with the same content. A change to its wording, badges, or sizes has to be
made in both. The Products page boxes have ids `pro-guard-20`,
`nonwoven-filter-fabric`, and `sod-staples`, which the phone menu and the
footer's Products list link to. The nonwoven
product is always called "Nonwoven Filter Fabric".

Each Products page box ends with a "More details" button: a `<details>`
element (class `product-details`) whose `<summary>` shows "More details"
when closed and "Hide details" when open, with no JavaScript. Inside are
install notes, the Nonwoven Filter Fabric "Choosing the right weight"
table (it turns into one card per weight on phones, using each cell's
`data-label`), and a link to the FAQ. The Pro Guard 20 box on the home page
has no "More details" section; only the Products page does.

The phone menu shows at 768px wide and below, where the top nav links and
the nav's "Request Wholesale Pricing" button are hidden. It is the
three-line `.menu-toggle` button plus the `#mobile-menu` list: Home (with
Benefits, Why We're Different, Compare, Contact), Products (with its three
product boxes), and FAQ, with the wholesale pricing button at the bottom. `menu.js` opens and
closes it and keeps `aria-expanded` and the button's label in step; keep
those working for screen reader and keyboard users.

## Rules

- **Change only what was asked about.** Do not improve adjacent copy, tidy
  markup, reformat, re-indent, or "modernize" anything. An unrequested
  improvement is a bug here, because nobody will notice it before it ships.
- **Stay in the smallest set of files that does the job.** A copy change is
  the page file it appears on (`index.html`, `faq.html`, or
  `products.html`) only. A color
  change is `styles.css` only. If a request seems
  to need more files than expected, say so before spreading out.
- **No build step, ever.** No npm, no `package.json`, no framework, no
  Tailwind, no bundler, no minification. Netlify publishes the repo root
  exactly as-is. If a change seems to need tooling, it is the wrong change.
- **Image filenames are case-sensitive on the server.** `Logo.PNG` and
  `logo.png` are different files to Netlify, even though they look the same
  on Windows. All current filenames are lowercase — keep it that way.
- Keep all image references pointing inside `images/`. Do not convert images
  back to base64 data URIs; embedding them is what made `index.html` 3.6 MB
  and impossible to edit before.

## Before you commit

Run the deploy check locally so problems surface now rather than in Netlify:

```bash
python3 validate.py
```

Use `python validate.py` on Windows — `python3` there hits the Microsoft
Store shortcut and fails. On Linux, including Claude Code on the web and
Netlify's build image, it is `python3`.

It exits 0 and prints `All checks passed` when the site is publishable. It
runs again on every deploy, so anything it catches would have blocked the
deploy anyway — but catching it here saves a failed build and a confused
question from whoever asked for the change.

Note what it does *not* do: it checks that the files are structurally sound,
never that the page looks right. Only the deploy preview shows that, and only
a person can judge it.

## Be extra careful

The person asking has full authority to make any edit to the site. When
they ask for a change in one of these areas, make it — do not stop to ask
permission. Then tell them plainly what to double-check on the deploy
preview. These are the areas where a mistake can break something without
anyone noticing.

- **The wholesale pricing form.** It is `name="wholesale-pricing"`, uses Netlify Forms
  (`data-netlify="true"`, the hidden `form-name` input, the `bot-field`
  honeypot), and posts to `/` via `handleFormSubmit` in `script.js`. Breaking
  any part of that silently stops wholesale leads from arriving, with no
  visible error on the page. This form *is* the distributor application —
  there is no separate application link.

  **Check the form in the repo source, never on the live site.** Netlify's
  build-time form detection deliberately strips `data-netlify="true"` and
  `netlify-honeypot` from the `<form>` tag and injects the hidden
  `form-name` input in their place. So on ns-geo.com those attributes are
  *supposed* to be missing, and the form tag comes back reserialized with
  single quotes. That is the detection having worked — not a fault. If you
  see them still present on the live page, detection did *not* run, which
  is the real problem. On the live page the positive signal is
  `<input type="hidden" name="form-name" value="wholesale-pricing" />`
  being present and matching the form's `name`.

  Do not "fix" a form that looks broken on the live site until you have
  checked the source. Neither check proves a submission actually arrives —
  only a real submission appearing under Netlify's Forms tab does.

  After any change that touches the form, tell them to check on the preview
  that the form still appears and its button still says "Request Wholesale
  Pricing", and to send one test submission after the change goes live and
  confirm it shows up under Netlify's Forms tab. Only that proves leads are
  still arriving.
- **`handleFormSubmit`'s status check.** It checks `response.ok` before
  reporting success. Without that check `fetch` resolves even on a 404 or
  500, so the form tells the customer "Request Sent" while the lead is lost.
  Never remove it as a side effect of another change. If a request would
  remove it, say in the same reply what it protects against.
- **Section ids and navigation.** On the home page, nav links are
  same-page anchors (`#products`, `#contact`, and so on). On other pages
  the same links point back to the home page (`/#products`, `/#contact`),
  and the logo points to `/`. The FAQ page is linked as `/faq` and the
  Products page as `/products`; the desktop "Products" link and the home
  page's "View Products" button go there, not to the home page's own
  `#products` section. Renaming a home page section `id`, or a Products
  page box id, breaks the matching links on every page. Every page and
  section in the desktop nav is also in the phone menu, and every page is
  reachable from the footer (the FAQ from the Company list, the Products
  page from the Products list). After a change here, tell
  them to tap every link in the desktop menu, the phone menu, and the
  footer, on every page, in the preview.
- **New pages, page titles and descriptions, and anything affecting
  search.** A new page needs the nav (with the phone menu) and footer
  copied from an existing page, links to it added to the desktop nav, the
  phone menu, and the footer on every page, `menu.js` loaded, and
  `validate.py` extended to check it the way it checks `faq.html`. Tell
  them to check the new page in the desktop menu, the phone menu, and the
  footer on every page, on a phone and on a computer.
- **Removing content.** Remove exactly what was asked, then list what was
  removed so they can confirm nothing else went.
- **Internal files.** Never let `CLAUDE.md`, `validate.py`, or `docs/` onto
  the public site. They sit under the published root and are kept out by
  redirects in `netlify.toml`.

## If a deploy fails

The site is fine. Netlify deploys are atomic, so a failed build leaves the
previous version live — ns-geo.com does not break, the change just does not
ship, and the reason is printed in the deploy log.

Read the log, fix the cause, and say in plain language what went wrong.

## Contact details currently on the page

Phone (385) 437-6527 · sales@northslopeindustries.com ·
2052 W 700 S, Unit J, Springville, UT 84663

The phone number, email, and address also appear in the footers of
`faq.html` and `products.html`, and the phone number appears in `script.js`, in the form's error
message. If any of them changes, it has to change in every one of those
files.
