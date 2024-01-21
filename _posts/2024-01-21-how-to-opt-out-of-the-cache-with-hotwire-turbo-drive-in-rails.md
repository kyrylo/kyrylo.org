---
layout: post
title: "How to opt out of the cache with Hotwire's Turbo Drive in Rails"
date: 2024-01-21 12:00:00 +0200
categories: rails turbo
redirect_from:
  - /rails/turbo/2024/01/20/how-to-opt-out-of-the-cache-with-hotwire-turbo-drive-in-rails.html
---

When using [Turbo Drive](https://turbo.hotwired.dev/handbook/introduction) and
clicking a link, sometimes you don't want that link to be pushed onto the
navigation stack. Modals, slideovers, and temporary screens require this kind of
behavior. With just a few lines of code, Turbo Drive makes this a reality.

In [Synonym Sprint][synonym-sprint], when I start a new game, the game state is
loaded, and the UI changes its look to show the user that they transitioned to
the game mode. Here we make a URL click:

<img src="https://imgur.com/NYlw8qB.gif" style="height: 500px">

When you complete a game, a `Turbo.visit` call happens through JavaScript. It
loads the post-game statistics. The statistics are rendered by the server as a
Turbo Frame.

<img src="https://imgur.com/L4Zz8QG.png" style="height: 500px">

You can click `Continue`, and another Turbo Frame will be loaded to show your
current leaderboard position.

<img src="https://imgur.com/VkK0Utl.png" style="height: 500px">

Then, you click `Continue` again and progress to the next level.

<img src="https://imgur.com/omvJWlt.png" style="height: 500px">

## Problem

The problem appears when you press the back button when you have cleared a
level. With normal navigation, you are redirected back to the game screen. This
is unexpected because in the app, there’s a clear distinction between the normal
and the game modes. You expect that going back will take you to the normal
screen instead.

<img src="https://imgur.com/NBbds2A.png" style="height: 500px">

## Solution

Turbo doesn't know anything about your state. We need to help it understand. We
are specifically interested in how Turbo deals with the cache.

Turbo caches every visit by default.

On the first screen, when we enter the game mode, we load the game URL
(`/games/new`). We need to tell Turbo to exclude the game page from the cache.

Add the `content_for?(:head)` check to your layout to be able to add new tags to
`<head>` from your views.

```erb
<%# app/views/layouts/application.html.erb %>

<% if content_for?(:head) %>
  <%= yield(:head) %>
<% end %>
```

Then, modify the template that loads the game state and add the
[`turbo-cache-control`][cache] directive.

```erb
<%# app/views/games/new.html.erb %>

<% content_for :head do %>
  <meta name="turbo-cache-control" content="no-cache">
<% end %>
```

Half of the job is already done!

This will prevent the issue that you can observe when you go back from the
normal mode to the game mode *after* you have already completed one game (e.g.,
loaded that screen once). For a fraction of a second, you will see the old
screen until the new one is loaded. We don’t want that because it makes the
experience janky.

Here's how it would look like _without_ `turbo-cache-control`:

<img src="https://imgur.com/ieZslIm.gif" style="height: 500px">

And here's how it looks with `no-cache` in place:

<img src="https://imgur.com/TvzuEhZ.gif" style="height: 500px">

We also no longer see the leaderboards screen when we navigate from the normal
mode screen!

The `no-cache` value for the `turbo-cache-control` told Turbo Drive to ignore
all the Turbo Frames we loaded while being on `/games/new`.

The final half of the job is to use `turbo_action: "replace"` when we leave the
game mode.

The first call to `Continue` is a normal link. It loads leaderboards in a Turbo
Frame:

```erb
<%= link_to "Continue", leaderboards_path(game) %>
```

However, the last call to `Continue` must be performed as a _replace_ visit.

> The `replace` visit action uses
> [history.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
> to discard the topmost history entry and replace it with the new location.

As we leave the game mode, we replace the `/games/new` URL with a new one, and
it essentially disappears from the navigation stack. I also added `turbo_frame:
"_top"` to break out of the game statistics Turbo Frame.

```erb
<%= link_to(
  "Continue",
  next_level_path(@game.level),
  data: {
    turbo_frame: "_top",
    turbo_action: "replace",
  }
) %>
```

Now we can go back to the previous level when we press the "Back" button. The
game screen is no longer loaded.

<img src="https://imgur.com/6yowfLE.gif" style="height: 500px">

Problem solved!

TL;DR. Use `<meta name="turbo-cache-control" content="no-cache">` with
`turbo_action: "replace"`.

You can discuss this article on X/Twitter:
<br>
[https://twitter.com/kyrylosilin/status/1749041960638165025][twitter]

[synonym-sprint]: https://synonymsprint.com
[twitter]: https://twitter.com/kyrylosilin/status/1749041960638165025
[cache]: https://turbo.hotwired.dev/handbook/building#opting-out-of-caching
