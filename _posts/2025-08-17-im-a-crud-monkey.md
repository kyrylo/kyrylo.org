---
layout: post
title: "I'm a proud CRUD monkey"
date: 2025-08-17
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

<blockquote cite="https://www.youtube.com/watch?v=vagyIcmIGOQ">
  <p>
    Web pages aren’t that different from what they were in the late ’90s, early
    2000s. They’re still just forms. They still just write to databases. A lot
    of people, I think, are very uncomfortable with the fact that they are
    essentially CRUD monkeys. They just make systems that create, read, update,
    or delete rows in a database and they have to compensate for that
    existential dread by over complicating things.
  </p>
  <p>
    &mdash; <a href="https://www.youtube.com/watch?v=vagyIcmIGOQ" target="_blank">
      DHH, Lex Fridman Podcast #474 (2025)
    </a>
  </p>
</blockquote>

When I started back in 2010, things weren’t easy. We had to:

- Worry about Internet Explorer 6.
- Round our corners with transparent PNGs.
- Mess with floats and clearfix hacks because Flexbox and Grid didn’t exist yet.

On top of that:

- Vendor prefixes (`-moz-`, `-webkit-`, `-ms-`) were everywhere.
- CSS couldn't center a div.
- Responsive design was just being born.
- jQuery was practically mandatory.
- Browsers were dumb.

We squeezed every kilobyte out of spritesheets to keep pages light. And through
it all, [Chrome was the new kid on the
block](https://x.com/kyrylosilin/status/1817825951864000573) - marketed as
blazingly fast compared to the dinosaurs. We were CRUD monkeys, locked in the
browser cage, hoping for the best.

## What we've achieved in 15 years

Fast forward to 2025, things are _a whole lot smoother_. We get to:

- Forget about Internet Explorer entirely (_hello Safari, though_)
- Round our corners with a single border-radius.
- Use Flexbox and Grid instead of floats and clearfix hacks.

On top of that:

- Vendor prefixes are mostly history.
- [CSS is a programming language](https://lyra.horse/css-clicker/).
- Responsive design is second nature with modern CSS units and container queries.
- jQuery is optional - frameworks and vanilla JS handle almost everything.
- Browsers are basically operating systems now.

But there's more!

- [Modern HTML features](https://justfuckingusehtml.com) (native dialogs, popups, new inputs), make building interactive UIs simpler and cleaner.
- WebAssembly runs high-performance code in any language.
- HTTP/2 and HTTP/3 deliver assets at lightning speed.
- Fast internet makes “waiting for images to load” a distant memory.

Boy, that's a lot of improvement over 15 years of web development. Heck, I can't
even track it all - didn't list half the improvements. CRUD monkeys now have the
tools to build blazingly fast websites and apps. Everything’s perfect in 2025,
right?

## The sad reality of 2025

Despite all this epic progress, websites in 2025 feel _slower_ than ever. It’s
nuts - landing pages now shamelessly slurp down [25 MB+ of
data](https://x.com/kyrylosilin/status/1956979517127360783) like it’s no big
deal. The browser revolution promised warp speed, but CRUD monkeys, thinking
they’ve busted out of their cage, keep stalling the real progress that
simplicity could bring.

Go back to [old-school websites](https://www.spacejam.com/) - they load in a
blink on today’s internet and scale like a dream. Sure, those were just HTML
pages, and now we’ve got dynamic apps that need more juice. But check this:
SQLite in 2015 could handle [400K to 500K HTTP requests a
day](https://www.sqlite.org/whentouse.html), and with a simple CPU bump that
number could probably be _even_ greater. You might not even need PostgreSQL for
your dynamic web app! How awesome is that?

Now, with all the compute power in the world, CRUD monkeys have turned into
gorilla wizards, tossing CPU and GPU cycles into a black hole. Their web apps
act like they’re the only show in town, draining your battery like a hamster
gone wild on a wheel. The maintenance that takes a brigade of DevOps, Senior
Frontend Router Engineers, Level 1 Build Specialists is the expected normality
in 2025.

## How did we get so miserable?

The gap between users and databases got stupidly wide. What used to be a
straight write or read to the DB is now a maze of layers, spawning fancy job
titles. We went from webmasters to this circus, even though our tools got _much_
simpler. It’s absurd - name me another job that celebrates complexity like ours!

There's a reason to this. **Simplicity is hard to sell**. You can’t hawk a
course on building a page like my homepage. It’d be a 1-hour lesson if you’re a
total newbie. Learn HTML, and you’re done. What else is there to milk? Instead,
we’ve cooked up complex tools that take weeks (or months) to master, promising
we’re more than CRUD monkeys. That morning mirror flex feels good, huh?

Now, everyone’s a prize exhibit in the FAANG zoo, because mastering this tangled
mess is what opens their gates. Being just a CRUD monkey doesn’t feel fun
anymore. If this is what “progress” looks like, I don’t want any part of it.

## What should we do about this

We must fight for a fast web, or it’ll remain a total mess. But the problem is,
you can’t just write a blog post shouting, "Yo, my site uses three CSS classes,
and here’s why it’s awesome!" - nobody cares. Still, simplicity makes life easier,
and if we embrace it, everyone benefits.

There's no universal pill to fix this. We can't magically unlearn years of bloat
and complexity. What we _can_ do, though, is call out the bad practices that waste
CPU cycles and leave our users in tears.

As a developer, here are things to remember when you publish something on the
web:

0. Be a CRUD monkey. Monkey see, monkey do.
1. Users are not hostages of your inflated dev ego. Don't make them suffer of your choices.
2. There are other apps and websites running alongside yours. Don't act like you're the centerpiece.
3. Every kilobyte counts. Don’t send them on a download pilgrimage for a simple action.
4. Performance is a feature. Fast sites feel thoughtful; slow sites feel careless.
5. Mobile users exist. Treat them like humans, not afterthoughts.
6. Not everyone has fiber. Some are still on 2G. Respect their time.
7. Less is more. If you can do it with fewer libraries, fewer animations, fewer requests - do it.
8. Accessibility isn’t optional. If someone can’t use your site, it’s broken, not “advanced”.
9. Your site doesn’t need to impress Google’s Chrome DevTools. It needs to work for humans.

Some people actively prove that a fast web is possible. Here are a few examples
(I’m not affiliated):

- [https://512kb.club/](https://512kb.club/)
- [https://1mb.club/about](https://1mb.club/about)

SaaS doesn’t have to feel enterprisey either. Here’s the fastest GitHub
alternative you’ve probably never heard of:

- [https://sr.ht/](https://sr.ht/)

The spirit of these projects deeply resonates with my values. Just because you
have keys from the zoo doesn’t mean you need a lion to guard your mailbox.

The web doesn't have to be a bloated beast. **Be the change**. Strip it down, speed
it up, and build something that respects users’ time and sanity. _I’m a proud
CRUD monkey_, and I’m betting you can be too. Let’s make the web fast again - together.
