---
layout: post
title: "How the pay-once business model saved my *aaS"
date: 2025-05-01
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

Yesterday, I launched Telebugs.

<blockquote>
  <p>Today is the day! @TelebugsHQ 1.0.0 is OUT!</p>
  <p>Pay $299/once and get:</p>

  <ul>
    <li>unlimited error tracking</li>
    <li>drop-in compatibility with your existing Sentry setup (just change one line)</li>
    <li>real-time push notifications</li>
    <li>full source code</li>
    <li>free updates</li>
  </ul>

  <p>One command to install. You're done.</p>

  <footer>
    &mdash; <a href="https://x.com/kyrylosilin/status/1917487516212510907" target="_blank">@kyrylosilin, Apr 30, 2025</a>
  </footer>
</blockquote>

To write that simple tweet, I had to grind daily for 3½ months. The work
involved was building the product, testing it with various SDKs, adding
automated smoke tests, benchmarking performance under load, creating the
marketing site, setting up the payment/license/email system, and crafting the
CLI to control Telebugs.

The launch sparked excitement. Tons of folks showed interest. I’d been building
this iteration in public from day one. But the road to launch wasn’t exactly a
straight line. Here’s my announcement tweet from earlier:

<blockquote id="announcement">
  <p>
    📣 Announcement: @TelebugsHQ is changing direction! We’re transforming into
    a self-hosted error tracking solution that’s no longer tied to Telegram.
  </p>

  <p>Why the change?</p>
  <ol>
    <li>Telegram didn’t click with the audience. ✄<em>&lt;snip&gt;</em></li>
    <li>Too much code is gatekeeping. ✄<em>&lt;snip&gt;</em></li>
    <li>Privacy concerns. ✄<em>&lt;snip&gt;</em></li>
    <li>It’s not competitive enough. ✄<em>&lt;snip&gt;</em></li>
    <li>I want to explore other ideas. ✄<em>&lt;snip&gt;</em></li>
  </ol>

  <footer>
    &mdash; <a href="https://x.com/kyrylosilin/status/1875334209344074193" target="_blank">@kyrylosilin, Jan 4, 2025</a>
  </footer>
</blockquote>

Wait, what? Telegram? Yep, it actually took me a full year to launch Telebugs.
Caught your attention?

Let me tell you the Telebugs story and how the pay-once business model saved my
sanity ;-)

## Backstory

On February 25, 2024 (my birthday btw), I texted [@charlestehio](https://x.com/charlestehio) on Telegram:

![telebugs.com - just registered. Can't sleep. I am too excited and keep thinking about it](/assets/images/posts/{{ page.slug }}/01.webp)

Back in 2022, Telegram launched [topics](https://telegram.org/blog/topics-in-groups-collectible-usernames#topics-in-groups).
I was already familiar with them, but that night, a simple idea popped into my head.

What if we connected Telegram and error tracking? I’ve been a Telegram user
since… heck, 2013? I can’t even remember. I’ve also been knee-deep in error
tracking for nearly a decade — interning at Bugsnag, then spending most of my
career at Airbrake.

Telegram felt like a match made in heaven. Check this out:

- A channel = a project
- A topic = an error group
- New errors bump the count in that topic
- Notifications? Built‑in.
- Teams? Invite people to your channel.
- Discussion? Right in the chat.

Nearly everything was free. Brilliant, right? So in March 2024,
[I started building it](https://x.com/kyrylosilin/status/1772349259267866796).

## Research

The concept was crystal clear, but the execution needed work. Too many questions:

- Do we need a dashboard?
- How will users manage errors?
- How will they resolve them?
- How will users sign up?
- How do new team members onboard?
- How do we create projects?
- What business model fits?
- How do we handle payments?
- How do we bill?
- Ruby’s Telegram API support is meh. What tech stack should I use?

The Telegram approach was a puzzle I had to work through. It’s a powerful
platform, but public best practices for building on it are nonexistent. So, with
great power comes great flexibility. And with great flexibility come injuries.
That’s how I got my first one.

## telebugs-api, telebugs-cli, and Telebugs Telegram Bot

I wanted to dodge a web dashboard at all costs. Users shouldn’t have to manually
create channels. Plus, how would they get a project token to send errors? We
needed an API.

![Telebugs API](/assets/images/posts/{{ page.slug }}/02.webp)

How would users interact with it? A CLI, of course.

![Telebugs CLI](/assets/images/posts/{{ page.slug }}/03.webp)

This was the rabbit hole I gleefully dove into.

The CLI could create channels, invite users, and set everything up for you,
thanks to [TDLib](https://core.telegram.org/tdlib).

To report errors, we needed a mechanism. In Telegram land, that’s a bot. So, I
tapped the Bot API and built one.

![Telegram Telebugs Bot in action](/assets/images/posts/{{ page.slug }}/04.webp)

But soon, it was clear there was no smooth path forward. I loved working with Go
(all the services ran on it). But the fun ended when I saw the user experience
nightmare. Users had to download a CLI, then wrestle with Telegram’s
APIs — grabbing `api_id` and `api_hash` that couldn’t be easily regenerated.

Not everyone was up for that. Many didn’t even know what Telegram’s APIs were.
On top of that, half my earlier questions still lingered, and it was obvious
this wasn’t the industrial-grade solution I’d hoped for.

## SaaSification

I ditched the CLI idea for a classic setup: a web dashboard <em>and</em> Telegram integration.

Suddenly, my research-phase questions had answers:

- Yes, we need a dashboard
- Users manage errors there
- Sign up with a Telegram account (no emails)
- Errors still post via the Telegram Telebugs bot

To pull this off, I swapped the CLI for a Rails app (payments, dashboard). The
freaked-out dev in me screamed, “Build for scale!” I listened. The bot and API
got repurposed for the new setup.

Database? PostgreSQL? Sure, but it wasn’t enough. I hopped on the ClickHouse
train. Now I had both. Because who doesn’t crave sub-millisecond queries? Our
stuff’s gotta load fast.

Toss in NATS too. How else do services talk? How does the API ping the bot about
a new error? How does the bot update the Rails dashboard when users poke it?

![Telebugs SaaS architecture](/assets/images/posts/{{ page.slug }}/05.webp)

Oh, and SDKs (libraries to send errors to my backend)? Built those from scratch!

![Telebugs SDKs](/assets/images/posts/{{ page.slug }}/06.webp)

See where this is going? It got way too complex, and I hadn’t even launched.
Cursed insanity! Still, I kept going — built a landing page and
[launched this shit](https://x.com/kyrylosilin/status/1830003860988944530).

Only now, as I type this, do I realize I’d lost my vision of a simple
Telegram-tied error tracker. The SaaS worked, but nobody wanted it.

![Telebugs in action](/assets/images/posts/{{ page.slug }}/07.webp)

While building and sharing updates, some kind folks pointed out they couldn’t
trust an indie dev with their data. That stuck with me the whole time.

My SaaS flopped. No clear vision, no target audience, no marketing clue.
Disaster.

Countless hours down the drain — but then, something great happened.
[Once.com](https://once.com) dropped Campfire/ONCE.

## ONCEficiation saved my sanity

ONCE cleared my blurry vision.

I was hooked from the first glance. It reignited my love for web dev. But I was
knee-deep in my SaaS mess with bells and subscriptions, so I couldn’t jump ship.
Secretly, I wanted to. So, I decided I’d eventually release a ONCE-inspired
Telebugs.

That’s when I got my shit together, scrapped the old plan, and started saving my
\*aaS. Cue the new direction <a href="#announcement">announcement</a>.

The puzzle pieces clicked. I knew the A-to-Z:

- Data? Not my problem
- Business cost? Minimal
- SDKs? Use what people know

The ONCE philosophy hits me on another level: simplicity. Less is more. Software
should be leaner, faster, focused.

The new Telebugs is built from the ground up on vanilla Rails, with the standard
conventions. It barely has any dependencies and tries to do as little as
possible while solving the actual problem: collecting, grouping, and notifying
of errors.

![Telebugs dependencies](/assets/images/posts/{{ page.slug }}/08.webp)

So, 3½ months later, here I am with a product that works, kicks ass, and chews
bubble gum.

No upsells, no dark patterns, no shady SaaS nonsense.
[Finished software](https://world.hey.com/dhh/finished-software-8ee43637) is
Telebugs’ endgame.

Curious how simple error tracking can be? [Watch the demo](https://telebugs.com/#installation) — **spoiler alert:** you’ll be up and running in minutes!
