---
layout: listing
image: assets/images/web-app-manifest-512x512.png?v=3
title: Blog
description: Thoughts on programming, life, and everything in between.
---

{% assign years = site.posts | group_by_exp: 'post', 'post.date | date: "%Y"' %}
{% for year in years %}
<section class="blog-year" aria-labelledby="year-{{ year.name }}">
  <h2 id="year-{{ year.name }}">{{ year.name }}</h2>
  <ul class="blog-posts">
{% for post in year.items %}
    <li>
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d" }}</time>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
{% endfor %}
  </ul>
</section>
{% endfor %}
