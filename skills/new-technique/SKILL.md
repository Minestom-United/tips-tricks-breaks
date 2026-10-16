---
name: new-technique
description: Create one new technique page for the Minecraft Backend Handbook. Use when asked to add, write, or document a new Minestom technique.
---

# New technique page

Write exactly one page per run. Do not read, copy from, or link to other technique pages. Each page must stand alone.

## Steps

1. Read `contribute.md` for the rules. Read `_data/categories.yml` for valid categories.
2. Pick the category. If none fits, add one to `_data/categories.yml` (`slug`, `label`, `blurb`).
3. Create `techniques/<slug>.md`, using the template below.
4. Check every Minestom call against the javadoc or source at the pinned version. Do not write code you haven't checked.
5. Run the checklist at the bottom.

## Template

```markdown
---
layout: default
title: "Short Name"
description: "One sentence: what the player sees."
permalink: /<slug>/
category: <slug from categories.yml>
status: source-verified
tags: [few, lowercase, keywords]
---

> **Verification:** `source-verified` on Minestom `<pinned version>`. What was checked, and what wasn't.
{: .note }

## What the player experiences

## Why it works

## Recipe

## Caveats, limits and revert
```

## Page rules

- `status` is `source-verified` or `playtested`. Use `playtested` only if it was run in-game, and name the client version.
- No shared context. Each page repeats its own imports, helper classes, and setup. Never write "see the camera page" or reuse a class defined elsewhere. A plain link for further reading is fine, but the page must make sense without it.
- Name the source for each factual claim (javadoc page, source file and method, issue or PR number). Mark guesses as predictions.
- Code is minimal, compiles against the pinned version, and includes how to revert.
- Plain, short sentences. No em dashes. No filler like "powerful", "seamless", or "leverage".
- No Minecraft or Mojang assets.
- Do not edit `index.md`, `_config.yml`, or the layout. The page shows up on `/techniques/` and the home page automatically from `category`.

## Checklist

- Front matter has `title`, `description`, `permalink`, `category`, `status`, `tags`.
- `category` exists in `_data/categories.yml`.
- `permalink` is unique.
- The page makes sense without any other page.
- `grep '—' techniques/<slug>.md` finds nothing.
