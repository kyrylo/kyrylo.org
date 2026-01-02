---
layout: page
image: assets/images/web-app-manifest-512x512.png
title: What I Write About
description: Thoughts on programming, life, and everything in between.
---

<section>
  <h2>What I Write About</h2>

  <ul class="blog-posts">
    {% for post in site.posts %}
      <li>
        <time datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%d %b, %Y" }}
        </time>
        <a href="{{ post.url }}">{{ post.title }}</a>
      </li>
    {% endfor %}
  </ul>
</section>
