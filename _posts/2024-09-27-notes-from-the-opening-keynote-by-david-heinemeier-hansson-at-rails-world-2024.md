---
layout: post
title: "Notes from the Opening Keynote by David Heinemeier Hansson at Rails World 2024"
date: 2024-09-27 12:00:00 +0200
categories: rails
image: https://i.imgur.com/J4NqLEq.png
---

<img src="https://i.imgur.com/J4NqLEq.png" style="margin-bottom: 1rem; width: 75%;" alt="DHH giving a talk at Rails World 2024">
<br>
During [DHH's Opening Keynote of Rails World 2024](https://www.youtube.com/watch?v=-cEn_83zRFw) in Toronto, Rails 8 beta was
shipped with Authentication, Propshaft, Solid Cache, Solid Queue, Solid Cable,
Kamal 2, and Thruster.

### Fighting Complexity in the Web:

- **Rails 8 is here**
- Rails has been following the latest programming trends for a while.
- DHH was never happy about this as they didn’t make sense to him.
- Webpacker in Rails 7 was an example, and DHH was never excited about it.
- Rails 7's introduction of ES6, HTTP2, and Importmaps brought back the excitement.
- DHH’s work on HEY made him realize that the industry is wrong.
- Rails doesn’t have to follow these rules.
- HEY went 100% #NOBUILD (CSS and JS served directly to the browser as written).
- For 20 years, people have said that Rails doesn’t scale.
- **@tobi** proved them wrong: Shopify handled 1 million requests/second in 2023.
- The argument is settled: _shut the fk up_.
- JS minification killed the web as a learning platform for new developers, saving only 2-5% overhead.
- We owe it to the open web to allow _view source_ and be proud of it.
- The trigger for DHH’s interest in #NOBUILD was when he failed to compile a JS project after leaving it alone for 5 minutes.
- **The browser is forever**. We can write CSS and markup from 30 years ago with no modifications.
- Craigslist is a great example.
- The more intermediaries between us and the browser we can remove, the better.
- Writing without JS and CSS pipelines isn’t for everyone, and that’s okay.
- DHH is still fired up after 20 years, pushing towards the _one-person framework_.
- DHH read a haiku in honor of Matz:
  _“Progress is our path, complexity builds the bridge, simplicity waits.”_
- Complexity is necessary for progress, but we stop once we’ve made things simple.
- **Rails 7 ethos**: rely on the browser.
- `{ safari: 17.2, chrome: 120, firefox: 121, opera: 106, ie: false }`
- The brain has a budget. Simplification helps optimize our _limited monkey brains_.
- DHH wants to make it easier for full-stack developers to see and keep the entire problem in their head.
- The mission of Rails is to compress the complexity of modern web apps.

### Deployments:

- **Ruby on Rails scales from HELLO WORLD to IPO.**
- Rails 7 is great at HELLO WORLD, but the bridge to IPO is missing.
- The first step of that bridge is **deployment**.
- We've become _pink elephants_, tied down by learned helplessness when it comes to deployment.
- The entire industry has cultivated a fear of touching servers or being responsible for computers.
- But we’re elephants; we can break free of the tiny rope.
- AWS is amazing, but most of us don’t live in Amazon’s context.
- The price for AWS’s insurance policy is high, not just financially but complexity-wise.
- AWS wants you to stay a pink elephant forever.
- **Heroku** was revolutionary in 2007 but hasn’t adapted to today’s context.
- Heroku’s Performance M (1 core/2 threads/2.5GB RAM/$250/mo) was a good deal in 2012. In 2024, it's ridiculous.
- DHH signed up for a **Hetzner hobby box** (48 cores/96 threads/256GB RAM/$220/mo).
- The difference is software: Heroku has nice software, but DHH prefers to make his own.
- **Vercel**: Let’s see who you really are! AWS with a 500% markup.
- **VCs**: _The insecurity of developers is a mass market. Let’s tap into that!_
- DHH hates software patents. They’re stupid and corrosive.
- Like medicine, software patents should expire after 20 years.
- Heroku commercialized deployment ergonomics, but we are overdue for generics.
- It shouldn’t cost $250 for basic compute. It should be 100x cheaper, and we can achieve that with open-source.
- Mission: **NoBuild, NoPaaS**. Rails will not require a commercial vendor for production deployment.
- The main path will be deploying to any hardware in any configuration.
- The cure for _server-phobia_ is called **LINUX**.
- CBT: _Cognitive-behavioral therapy_, one little exposure at a time.
- **OMAKUB**: DHH’s favorite Linux environment.
- **90% of server security** is denying password authentication with SSH.
- **Lock the door**. It’s fun to be competent and know Linux.
- DHH’s favorite number is 8 because when tilted, it becomes the infinity symbol.

### Rails 8 Features:

- **Authentication**:
  - Rails won’t ship with Devise, but it will generate authentication code for you.
  - The code is an extraction from 37signals’ apps. You can learn it and level up.
- **Propshaft**:
  - Propshaft simplifies the old ACID pipeline.
  - It solves for today’s context without old baggage.
  - Propshaft is easy to understand, unlike Sprockets.
  - It’s based on the idea that modern browsers allow us to ship code directly to the user.
- **Solid Adapters**:
  - Rails 8 introduces _solid_ adapters: solid_cable, solid_cache, solid_queue.
  - It all runs from **One Ring** (One database system).
  - **SQLite**: Now you don’t even have to know how to set up a database.
  - **Solid Cable**: A SQLite-backed adapter for Action Cable, replacing Redis.
  - **Solid Cache**:
    - Basecamp uses it in production (10TB cache for 60 days, 96% hit rate).
    - It supports encryption, built on top of Active Record.
    - **Privacy**: HEY deletes everything (including logs) within 60 days.
    - It can scale beyond 10TB.
  - **Solid Queue**:
    - DHH didn’t want to use 7 gems just to process jobs.
    - Solid Queue is highly performant, works with all 3 major DBs, and supports recurring jobs.
    - HEY runs 20 million jobs/day using Solid Queue.
- **Thruster**:
  - Thruster replaces nginx, proxies, and other intermediaries between your app and the internet.
  - It brings X-Sendfile acceleration, Cache-Control, and GZip (Brotli in the works).
  - It’s installed by default in the Docker image.
  - Thruster is written in Go and can handle 60,000 RPS.
- **Kamal 2**:
  - Kamal 2 helps deploy apps to the cloud or any other environment.
  - It includes Auto SSL via Let’s Encrypt and supports multiple apps on a single server.
  - The team is working to eliminate the need for Docker Hub as a requirement.

### Future:

- **Rails 8.1**:
  - **Action Notifier**: A framework for web push notifications to get away from needing native apps.
  - **Active Record Search**: A simpler, more intuitive search framework.
  - **Action Text with Markdown Support** (called House MD).
  - **Kamal 2.1** and plenty of other great updates.
