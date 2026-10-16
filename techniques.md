---
layout: default
title: "Techniques"
description: "Browse every technique by category, or search by name and tag."
permalink: /techniques/
---

<div class="finder">
<input type="search" id="finder-q" class="finder-q" placeholder="Search techniques or tags" aria-label="Search techniques">
<div class="chips" role="group" aria-label="Filter by category">
<button type="button" class="chip is-on" data-cat="">All</button>
{%- for c in site.data.categories -%}
<button type="button" class="chip" data-cat="{{ c.slug }}">{{ c.label }}</button>
{%- endfor -%}
</div>
</div>

{%- assign items = site.pages | where_exp: "p", "p.category" | sort: "title" -%}
<ul class="tech-list" id="tech-list">
{%- for p in items -%}
<li class="tech" data-cat="{{ p.category }}" data-text="{{ p.title | append: ' ' | append: p.description | append: ' ' | append: p.category | append: ' ' | append: p.tags | join: ' ' | downcase | escape }}">
<a class="tech-title" href="{{ p.url | relative_url }}">{{ p.title }}</a>
<span class="tech-status">{{ p.status }}</span>
<p class="tech-desc">{{ p.description }}</p>
<ul class="tag-list">
{%- for t in p.tags -%}<li class="tag">{{ t }}</li>{%- endfor -%}
</ul>
</li>
{%- endfor -%}
</ul>
<p class="finder-empty" id="finder-empty" hidden>No techniques match.</p>
