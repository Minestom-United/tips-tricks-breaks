---
layout: default
title: "Contribute"
description: "House rules: version pins, minimal code, verification labels, and no Mojang assets."
permalink: /contribute/
tags: [meta]
---

> Every page on this site has to meet these rules before it is published.
{: .tip }

## The five-part shape

Each technique page follows the same order, with the explanation before the code:

1. **What the player experiences.** Plain language, no jargon.
2. **Why it works.** Which packet or entity-data field the client obeys, and
   what each setting does.
3. **Minimal code.** Include the imports. It should run in a command or event
   listener on the pinned Minestom version (currently `2026.10.07-26.2`).
   Re-pin and re-check signatures when the version changes.
4. **Caveats, limits and revert.** Side effects, version dependence, and how to
   undo the effect.
5. **Verification label.** `source-verified` means the javadoc and source were
   checked but the code wasn't run live. `playtested` means it was run in-game,
   with the client version noted. Never inflate a label: if the mechanism is
   confirmed but the player experience is untested, use `source-verified`.

## Front matter

Every technique page sets `category` (a `slug` from `_data/categories.yml`),
`status` (`source-verified` or `playtested`), and `tags`. That is all it takes
to appear on the [techniques page]({{ '/techniques/' | relative_url }}) and the
home page. Never add a technique to the navbar. Each page must make sense on its
own, without relying on code or context from another page.

## Fact-checking

Every factual claim must name its source: a javadoc page, a server source file
and method, a wiki page, or an issue or PR number. Mark predictions about client
behavior as predictions until someone playtests them. If you only suspect a
clamp, a packet order requirement, or a side effect, say so, and say what would
confirm it.

## Assets

Use original CSS and SVG only. **No Minecraft or Mojang assets**: no textures,
models, sounds, fonts, logos, or screenshots that contain them. Redraw diagrams
instead of capturing them.

## How to propose a change

Open a pull request against this repo with the new or updated `.md` page. Keep
each PR to one technique so its verification label can be reviewed on its own.
