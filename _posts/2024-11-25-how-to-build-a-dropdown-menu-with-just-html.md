---
layout: post
title: How to build a dropdown menu with just HTML
date: 2024-11-25 01:00:00 +0200
categories: html
image: assets/images/kyrylo-silin@2x.webp
---

In web development, there are countless ways to create a dropdown menu. The
traditional method is to use JavaScript to toggle visibility. But what if I told
you that you don’t need JavaScript at all?

I’m always searching for the simplest way to do things. This time, while
building a locale selector for [Flag Match](https://flagmatch.com), I wanted to
allow users to switch between languages without relying on JavaScript.

<img src="https://cdn.kyrylo.org/images/2024-11-25-1.webp" width="260" height="140" alt="Flag Match locale selector">

In a typical Rails project, I’d often use a [Stimulus controller](https://gist.github.com/kyrylo/861eb55f7ad166432789ed491d558cde) for this. While it looks simple enough, there’s actually quite a lot going on:

- Connecting the Stimulus controller to the dropdown HTML element.
- Defining a target for the content to be shown or hidden.
- Setting up click event listeners.
- Toggling the dropdown’s visibility.

That’s a lot of work for something as straightforward as a dropdown menu.

## The traditional approach

You might argue that this complexity comes from using
[Stimulus](https://stimulus.hotwired.dev/), which can be more verbose than plain
JavaScript. True, but even with plain JavaScript, some setup is still required.

Traditionally, dropdown menus use JavaScript. You’d typically have a button or
link that toggles the visibility of a dropdown menu by adding or removing a CSS
class that changes the `display` property.

Here’s an example:

<button onclick="toggleDropdown()">Dropdown menu</button>

<ul style="display: none; position: absolute; background: silver;" id="dropdown">
  <li>Option 1</li>
  <li>Option 2</li>
  <li>Option 3</li>
</ul>

<script>
  function toggleDropdown() {
    var dropdown = document.getElementById("dropdown");
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  }
</script>

```html
<button onclick="toggleDropdown()">Dropdown menu</button>
<ul
  style="display: none; position: absolute; background: silver;"
  id="dropdown"
>
  <li>Option 1</li>
  <li>Option 2</li>
  <li>Option 3</li>
</ul>

<script>
  function toggleDropdown() {
    var dropdown = document.getElementById("dropdown");
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  }
</script>
```

This works well and is probably how you’ve done it in the past. But what if I
told you there’s a way to create a dropdown menu without any JavaScript?

## The no-JavaScript dropdown approach (with HTML and a sprinkle of CSS)

Enter the
[`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
and
[`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary)
HTML tags.

These tags create a disclosure widget that lets users access additional
information or controls. Sounds like a dropdown menu, doesn’t it?

Here’s how to use them:

<details>
  <summary>Dropdown menu</summary>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
    <li>Option 3</li>
  </ul>
</details>

```html
<details>
  <summary>Dropdown menu</summary>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
    <li>Option 3</li>
  </ul>
</details>
```

That’s it! No JavaScript needed. The browser handles the toggling for you. The
`<details>` element is supported in all modern browsers, including Chrome,
Firefox, Safari, and Edge.

The triangle next to the "Dropdown menu" might not fit your design. You can
remove it with CSS:

<details class="no-triangle">
  <summary>Dropdown menu (click me)</summary>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
    <li>Option 3</li>
  </ul>
</details>

<style>
  /* Hide the triangle that appears next to the summary text */
  details.no-triangle > summary {
    list-style: none;
  }
  /* Webkit browsers (Chrome, Safari, newer Edge) */
  details.no-triangle > summary::-webkit-details-marker {
    display: none;
  }
  /* Firefox */
  details.no-triangle > summary::marker {
    display: none;
  }
  /* Legacy Edge/IE (though Edge now uses Webkit) */
  details.no-triangle > summary::-o-details-marker {
    display: none;
  }
  /* For older Firefox versions */
  details.no-triangle > summary::-moz-list-bullet {
    list-style-type: none;
  }
</style>

<hr>

```css
/* Hide the triangle that appears next to the summary text */
details > summary {
  list-style: none;
}
/* Webkit browsers (Chrome, Safari, newer Edge) */
details > summary::-webkit-details-marker {
  display: none;
}
/* Firefox */
details > summary::marker {
  display: none;
}
/* Legacy Edge/IE (though Edge now uses Webkit) */
details > summary::-o-details-marker {
  display: none;
}
/* For older Firefox versions */
details > summary::-moz-list-bullet {
  list-style-type: none;
}
```

<hr>

If you want the dropdown to resemble a traditional menu, apply these styles:

<details class="fancy">
  <summary>Dropdown menu</summary>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
    <li>Option 3</li>
  </ul>
</details>

<hr>

```css
/* Style the dropdown */
details {
  display: inline-block;
  position: relative;
}

details > summary {
  padding: 0.5rem;
  background: silver;
  cursor: pointer;
}

details > ul {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid silver;
  padding: 0.5rem;
}

details[open] > ul {
  display: block;
}
```

<style>
  details.fancy {
    display: inline-block;
    position: relative;
  }

  details.fancy > summary {
    padding: 0.5rem;
    background: silver;
    cursor: pointer;
  }

  details.fancy > ul {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid silver;
    padding: 0.5rem;
  }

  details.fancy[open] > ul {
    display: block;
  }

  details.fancy > ul > li {
    list-style: none;
  }

  details.fancy > ul > li:hover {
    background: lightgray;
    cursor: pointer;
  }
</style>

<hr>

This will make the dropdown look like a traditional menu. You can customize the
styles further to match your design.

One caveat: this approach doesn’t automatically close the dropdown when clicking
outside of it—a common feature in JavaScript-based menus. If you need this,
you’ll have to [add JavaScript](https://gist.github.com/kyrylo/1265f012a1913d873b345746153b5b45).

Also, note that `<details>` and `<summary>` aren’t intended for this purpose,
though there’s no penalty for using them this way. The HTML specification
discourages their use as dropdown menus:

<blockquote cite="https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element">
  <p>
    As with all HTML elements, it is not conforming to use the <code>details</code> element when attempting to represent another type of control. For example, tab widgets and menu widgets are not disclosure widgets, so abusing the <code>details</code> element to implement these patterns is incorrect.
  </p>
  <p>&mdash; <a href="https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element" target="_blank">4.11.1 The details element</a></p>
</blockquote>

## Conclusion

Creating a dropdown menu without JavaScript is entirely possible with `<details>`
and `<summary>`. This approach is simple, clean, and accessible, with built-in
browser support.

If you’re looking for a straightforward way to create a dropdown menu, give
`<details>` and `<summary>` a try. They might surprise you with how effective and
easy they are to use. Let me know how it works for you!
