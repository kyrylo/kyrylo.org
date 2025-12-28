---
layout: page
image: assets/images/web-app-manifest-512x512.png
---

<section>
  <h2>What I write about</h2>

  <ul>
    {% for post in site.posts %}
      <li>
        <time datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%b %-d, %Y" }}
        </time>
        &ndash;
        <a href="{{ post.url }}">{{ post.title }}</a>
      </li>
    {% endfor %}
  </ul>
</section>
