#!/usr/bin/env python3
"""
Pre-deploy sanity check for ns-geo.com.

Runs as the Netlify build command. Netlify deploys are atomic, so a
non-zero exit here means the deploy fails and the last good version of the
site stays live. That is the point: an editor pastes whole files by hand
and ships straight to main with no review, so this is the only thing
between a bad paste and the live site.

Checks are deliberately mechanical -- missing files, broken image paths,
a mangled form, a truncated paste. Nothing stylistic, nothing subjective.
A false positive here blocks every deploy, so when in doubt this stays
quiet.

No dependencies. Standard library only.
"""

import os
import re
import sys

errors = []
warnings = []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ---------------------------------------------------------------- files

for f in ["index.html", "styles.css", "script.js"]:
    if not os.path.isfile(f):
        fail("Required file is missing: " + f)

if errors:
    for e in errors:
        print("ERROR: " + e)
    sys.exit(1)

html = open("index.html", encoding="utf-8", errors="replace").read()
css = open("styles.css", encoding="utf-8", errors="replace").read()
js = open("script.js", encoding="utf-8", errors="replace").read()
low = html.lower()


# ------------------------------------------------- truncated / partial paste

# The classic failure: a chat returns only part of the file, or the paste
# gets cut off partway. If the document does not close, it was not complete.
for tag in ["html", "head", "body"]:
    if "<" + tag not in low:
        fail("index.html has no <%s> tag -- the paste looks incomplete." % tag)
    if "</" + tag + ">" not in low:
        fail("index.html never closes </%s> -- the paste looks truncated." % tag)

# Placeholder phrases that mean a fragment was returned instead of a whole file.
for phrase in [
    "rest of the file",
    "rest of file",
    "remains unchanged",
    "rest unchanged",
    "[truncated]",
    "rest of your",
    "same as before",
    "no changes here",
    "unchanged from",
]:
    if phrase in low:
        fail(
            "index.html contains the text '%s'. That is placeholder text from "
            "a chat reply, not real page content -- the file is incomplete."
            % phrase
        )

# Unbalanced divs mean the markup got mangled somewhere in the middle.
opens = len(re.findall(r"<div\b", html, re.I))
closes = len(re.findall(r"</div\s*>", html, re.I))
if opens != closes:
    fail(
        "index.html has %d opening <div> but %d closing </div>. The markup is "
        "unbalanced and the page will render wrong." % (opens, closes)
    )


# ------------------------------------------------------------ stylesheet / js

if 'href="styles.css"' not in html:
    fail("index.html no longer links styles.css -- the page would be unstyled.")
if 'src="script.js"' not in html:
    fail(
        "index.html no longer loads script.js -- the animations and the form "
        "submit handler would not run."
    )


# ------------------------------------------------------------------- images

# Every images/ reference must resolve to a real file with exactly matching
# case. Netlify's servers are case-sensitive and Windows is not, so this
# class of bug is invisible until it is already live.
on_disk = set(os.listdir("images")) if os.path.isdir("images") else set()
referenced = set()

for text, where in ((html, "index.html"), (css, "styles.css")):
    for m in re.finditer(r"images/([A-Za-z0-9._-]+)", text):
        name = m.group(1)
        referenced.add(name)
        if name in on_disk:
            continue
        near = [f for f in on_disk if f.lower() == name.lower()]
        if near:
            fail(
                "%s references images/%s but the file in the repo is called "
                "images/%s. Filenames are case-sensitive on the server, so "
                "that image would not load." % (where, name, near[0])
            )
        else:
            fail("%s references images/%s, which does not exist." % (where, name))

for f in sorted(on_disk - referenced):
    warn("images/%s is in the repo but nothing on the site references it." % f)


# --------------------------------------------------------------------- form

# The wholesale form is how distributor leads arrive. If it breaks, the page
# still looks correct and still tells the customer "Request Sent", so nobody
# notices until the leads have already stopped coming.
form_parts = [
    ('name="wholesale-pricing"', "the name Netlify files submissions under"),
    ('data-netlify="true"', "the attribute that makes Netlify handle the form"),
    ('name="form-name"', "the hidden input Netlify needs to route submissions"),
    ('name="bot-field"', "the spam honeypot"),
]
for needle, why in form_parts:
    if needle not in html:
        fail(
            "The wholesale pricing form is missing %s -- %s. Leads would "
            "silently stop arriving while the page still reported success."
            % (needle, why)
        )

if "handleFormSubmit" not in js:
    fail(
        "script.js no longer defines handleFormSubmit -- submitting the form "
        "would throw an error instead of sending."
    )
if "handleFormSubmit" not in html:
    fail(
        "index.html no longer calls handleFormSubmit -- the form would do a "
        "full page reload instead of submitting cleanly."
    )


# ------------------------------------------------------- no base64 regression

if re.search(r"data:image/[a-z.+-]+;base64", html, re.I) or re.search(
    r"data:image/[a-z.+-]+;base64", css, re.I
):
    fail(
        "An image was pasted back as an embedded base64 data URI. Images "
        "belong in images/ as real files -- embedding them is what made this "
        "file impossible to edit in the first place."
    )


# ------------------------------------------------------------ no build creep

for f in ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"]:
    if os.path.isfile(f):
        fail(
            "%s has appeared. This site must stay dependency-free with no "
            "build step." % f
        )


# ------------------------------------------------------------------- report

for w in warnings:
    print("WARNING: " + w)

if not errors:
    print("All checks passed. index.html is {:,} bytes. Publishing.".format(len(html)))
    sys.exit(0)

print("")
print("=" * 70)
print(" DEPLOY BLOCKED -- %d problem(s) found in this change" % len(errors))
print("=" * 70)
for e in errors:
    print("")
    print(" * " + e)
print("")
print("-" * 70)
print(" ns-geo.com has NOT changed. The previous version is still live, so")
print(" the site is fine -- this change just did not go out.")
print("")
print(" Most likely cause: the file pasted back was incomplete. Copy the")
print(" file fresh out of GitHub and redo the edit, making sure the whole")
print(" file gets pasted, from the very first line to the very last.")
print("-" * 70)
sys.exit(1)
