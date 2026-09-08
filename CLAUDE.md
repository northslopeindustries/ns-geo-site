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

As the page stands today it is entirely wholesale-facing, so consumer and
brand material is new content rather than a rewrite.

**Never send an end user to buy direct.** North Slope sells *to*
distributors; they are the customers. Point homeowners and contractors toward
finding a nearby distributor, never toward buying from North Slope. Rewriting
an existing wholesale section in consumer language is a strategy decision —
flag it rather than doing it.

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

1. You edit the files in the repo.
2. The change goes onto a **branch** and into a **pull request**.
3. Whoever asked for it merges the PR.
4. Netlify builds `main`, runs `validate.py`, and publishes to ns-geo.com.

**Always work on a branch and open a PR — never commit straight to `main`.**
Not as a review gate; nobody is required to review. The reason is recovery: a
merged PR has a one-click **Revert** button in GitHub, so a non-technical
person can undo a bad change by themselves. A direct commit to `main` has no
such button, and undoing it needs either git or Netlify access that they may
not have.

Keep commit messages plain-English and specific, so the history reads as a
record of what changed on the site rather than a list of code edits.

## Files

| File | Contains | Touch it for |
|---|---|---|
| `index.html` | Page content and text (~32 KB) | Wording, headings, contact details, adding or removing content |
| `styles.css` | All styling | Colors, spacing, fonts, sizes, layout |
| `script.js` | Scroll animations, counters, form submit | Rarely — behavior only |
| `images/` | 9 image files | Swapping or adding photos |
| `validate.py` | The pre-deploy check | Only when the checks themselves need changing |
| `netlify.toml` | Hosting config and the deploy check | Rarely |
| `docs/` | Internal notes, not published | Documentation changes |

`index.html` is divided by comment markers named after what they visibly
are on the page — `HERO`, `PRODUCTS`, `CONTACT FORM`, `FOOTER`, and so on.
Use them to locate a section when someone says "the products section."

## Rules

- **Change only what was asked about.** Do not improve adjacent copy, tidy
  markup, reformat, re-indent, or "modernize" anything. An unrequested
  improvement is a bug here, because nobody will notice it before it ships.
- **Stay in the smallest set of files that does the job.** A copy change is
  `index.html` only. A color change is `styles.css` only. If a request seems
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

If you changed how the page looks, say plainly that you have not seen it
rendered, rather than implying it was checked.

## Flag, do not act

Describe the change and ask before doing any of these:

- **The contact form.** It is `name="wholesale-pricing"`, uses Netlify Forms
  (`data-netlify="true"`, the hidden `form-name` input, the `bot-field`
  honeypot), and posts to `/` via `handleFormSubmit` in `script.js`. Breaking
  any part of that silently stops wholesale leads from arriving, with no
  visible error on the page. This form *is* the distributor application —
  there is no separate application link.
- **`handleFormSubmit`'s status check.** It checks `response.ok` before
  reporting success. Without that check `fetch` resolves even on a 404 or
  500, so the form tells the customer "Request Sent" while the lead is lost.
  Do not remove it.
- **Navigation or site structure.** All nav links are same-page anchors
  (`#products`, `#contact`, and so on). Renaming a section `id` breaks the
  matching nav link.
- Adding pages, changing the page title, or anything affecting SEO.
- Removing content, rather than editing it.
- Anything that would put `CLAUDE.md`, `validate.py`, or `docs/` onto the
  public site. They sit under the published root and are kept out by
  redirects in `netlify.toml`.

## If a deploy fails

The site is fine. Netlify deploys are atomic, so a failed build leaves the
previous version live — ns-geo.com does not break, the change just does not
ship, and the reason is printed in the deploy log.

Read the log, fix the cause, and say in plain language what went wrong.

## Contact details currently on the page

Phone (385) 437-6527 · sales@northslopeindustries.com ·
2052 W 700 S, Unit J, Springville, UT 84663

The phone number also appears in `script.js`, in the form's error message.
If it changes, it has to change in both files.
