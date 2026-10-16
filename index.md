---
layout: default
title: "Minecraft Backend Handbook"
description: "Client-side effects through server packets, built in Minestom with minimal code."
---

This handbook collects backend techniques that make the **vanilla client** show
things the server API doesn't expose. The techniques work at the protocol level,
so any backend that can send the right packets can use them. Every example here
is written for **Minestom**, checked against the javadoc and server source, and
kept as short as possible.

> **How to read this site:** each technique explains *why it works* before the
> code, names the setting that controls the effect, and carries a verification
> label. `source-verified` means checked against the javadoc and server source,
> but not yet run on a live client. `playtested` means run in-game, with the
> client version noted.
{: .note }

## Browse by category

{% for c in site.data.categories -%}
{%- assign n = site.pages | where: "category", c.slug | size -%}
- **[{{ c.label }}]({{ '/techniques/' | relative_url }}#{{ c.slug }})** ({{ n }}): {{ c.blurb }}
{% endfor %}
Or [search all techniques]({{ '/techniques/' | relative_url }}).

## Ground rules

All snippets target Minestom `2026.10.07-26.2` (checked October 2026). Minestom
changes quickly, so if a signature has changed, the
[contributing guide]({{ '/contribute/' | relative_url }}) explains how to
report it. All art and CSS are original. **No Minecraft or Mojang assets** are
used anywhere on this site. This site is not affiliated with Mojang or Microsoft.
