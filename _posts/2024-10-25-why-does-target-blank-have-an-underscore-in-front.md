---
layout: post
title: Why does target="_blank" have an underscore in front?
date: 2024-10-25 12:00:00 +0200
categories: html
---

Ever wondered why you need the underscore in `target="_blank"` to open a link in
a new tab?

Before HTML5, developers used
[`<frameset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset)
for SPA-like functionality, dividing the window into multiple frames, each with
its own unique ID. For example, the left frame might be `name="sidebar"`, and the
right frame could be `name="content"`.

When clicking a link, the browser needed to know which frame to load the content
into. That's where the target attribute came in. Clicking a link in the sidebar,
for example, would load the content in the content frame:

```html
<a href="/pricing" target="content"></a>
```

Now, if you had a frame named "blank" and used `<a href="/" target="blank">`,
the content would load in that frame. But if no such frame existed, the browser
would create a new window (not a tab, as browsers didn't support tabs at the
time) and assign it the "blank" name. Clicking the same link again wouldn’t open
another tab.

So why the underscore in `target="_blank"`?

It's simple - developers needed a way to explicitly tell the browser to open the
link in a new tab, free of frame semantics. The underscore signifies a **special
value** rather than a **frame name**.

P.S. Don't use `<frameset>`. It's deprecated in HTML5.
