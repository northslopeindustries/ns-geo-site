# Editing the ns-geo.com website

## What this site is

The wholesale site for **North Slope Geotextiles** (North Slope Industries),
a direct importer and regional distributor of commercial-grade weed barrier
fabric, based in Springville, Utah. Main product is Pro Guard 20; the site
also covers sod staples and filter fabric.

**The audience is distributors and wholesale buyers** — nurseries, garden
centers, rock yards, and landscape supply yards who resell to their own
customers. It is **not** homeowners, DIY, or retail consumers. Copy talks
about margins, minimum orders, fulfillment speed, and reselling. Never let
it drift toward consumer or DIY framing, even when asked to make it
"friendlier" or "more approachable."

## The person editing this is not a developer

They copy a file out of GitHub's web editor, paste it into a Claude chat,
describe the change in plain English, paste the result back, and commit.
They cannot read code, cannot test locally, and cannot diagnose a broken
page. Netlify publishes to ns-geo.com automatically on every commit to
`main`, with no review step.

So:

- **Always return the complete file.** Never a fragment, never a diff,
  never "the rest is unchanged," never "add this line after line 40."
  They are pasting over the whole file by hand.
- If a change is too large to return in full, say so and suggest
  splitting it across separate edits — do not return a partial file.
- Say which file they are pasting back, by name.

## Files

| File | Contains | Touch it for |
|---|---|---|
| `index.html` | Page content and text (~33 KB) | Wording, headings, contact details, adding or removing content |
| `styles.css` | All styling | Colors, spacing, fonts, sizes, layout |
| `script.js` | Scroll animations, counters, form submit | Rarely — behavior only |
| `images/` | 9 image files | Swapping or adding photos |

`index.html` is divided by comment markers named after what they visibly
are on the page — `HERO`, `PRODUCTS`, `CONTACT FORM`, `FOOTER`, and so on.
Use them to locate a section when someone says "the products section."

## Rules

- **No build step, ever.** No npm, no `package.json`, no framework, no
  Tailwind, no bundler, no minification. Netlify publishes the repo root
  exactly as-is. If a change seems to need tooling, it is the wrong change.
- **Change only what was asked about.** Do not improve adjacent copy, tidy
  markup, reformat, re-indent, or "modernize" anything. An unrequested
  improvement is a bug here, because nobody will notice it before it ships.
- **Image filenames are case-sensitive on the server.** `Logo.PNG` and
  `logo.png` are different files to Netlify, even though they look the same
  on Windows. All current filenames are lowercase — keep it that way.
- Keep all image references pointing inside `images/`. Do not convert
  images back to base64 data URIs; that is what made this file unusable
  before.

## Flag, do not act

Describe the change and ask before doing any of these:

- **The contact form.** It is `name="wholesale-pricing"`, uses Netlify
  Forms (`data-netlify="true"`, the hidden `form-name` input, the
  `bot-field` honeypot), and posts to `/` via `handleFormSubmit` in
  `script.js`. Breaking any part of that silently stops wholesale leads
  from arriving, with no visible error on the page. This form *is* the
  distributor application — there is no separate application link.
- **Navigation or site structure.** All nav links are same-page anchors
  (`#products`, `#contact`, and so on). Renaming a section `id` breaks the
  matching nav link.
- Adding pages, changing the page title, or anything affecting SEO.
- Removing content, rather than editing it.

## There is a check before anything goes live

`validate.py` runs on every deploy (via `netlify.toml`). If it finds a
problem, the deploy fails and the previous version of the site stays live —
so a bad paste cannot break ns-geo.com, it just does not ship, and the
reason appears in the Netlify deploy log.

It checks that the paste was complete (nothing truncated, no "rest of the
file unchanged" placeholder text, balanced `<div>` tags), that `styles.css`
and `script.js` are still linked, that every `images/` reference resolves to
a real file with exactly matching case, and that the form still has its
Netlify attributes. It does not check anything stylistic.

If a deploy fails, the usual cause is a file that was pasted back
incompletely. Copy it fresh out of GitHub and redo the edit.

## Contact details currently on the page

Phone (385) 437-6527 · sales@northslopeindustries.com ·
2052 W 700 S, Unit J, Springville, UT 84663

The phone number also appears in `script.js`, in the form's error message.
If it changes, it has to change in both files.
