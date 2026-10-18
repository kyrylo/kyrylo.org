---
layout: listing
listing_class: projects-gallery
stylesheet: /assets/stylesheets/projects.css
image: assets/images/web-app-manifest-512x512.png?v=3
title: Projects
heading: A few useful things. A few just for fun.
description: My projects, doodles, vibe-coded experiments.
---

{% for section in site.data.projects %}
<section class="project-section" aria-labelledby="{{ section.id }}">
  <h2 id="{{ section.id }}">{{ section.title | escape }}</h2>
  <ul class="project-grid">
{% for project in section.projects %}
    <li>
      <a class="project-card" href="{{ project.url }}" aria-labelledby="project-{{ project.id }}" aria-describedby="description-{{ project.id }}">
        <span class="project-cover">
          <img src="{{ '/assets/images/projects/' | append: project.image | relative_url }}" alt="" width="720" height="405" loading="{% if section.id == 'current-projects' and forloop.index <= 2 %}eager{% else %}lazy{% endif %}" decoding="async">
        </span>
        <h3 id="project-{{ project.id }}">{{ project.name | escape }}</h3>
        <p id="description-{{ project.id }}">{{ project.description | escape }}</p>
      </a>
{% if project.source_url %}
      <a class="project-source" href="{{ project.source_url }}" aria-label="{{ project.name | escape }}: {{ project.source_label }}">{{ project.source_label }}</a>
{% endif %}
    </li>
{% endfor %}
  </ul>
</section>
{% endfor %}
