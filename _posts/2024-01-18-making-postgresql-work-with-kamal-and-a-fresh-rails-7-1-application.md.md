---
layout: post
title: "Configuring PostgreSQL for Kamal and a new Rails 7.1 app"
date: 2024-01-18 00:23:44 +0200
categories: rails kamal
image: https://imgur.com/QXZ4UJG.png
---

<img src="https://imgur.com/QXZ4UJG.png" style="margin-bottom: 1rem;">
<br>
While working on provisioning [Synonym Sprint][synonym-sprint], a Rails 7.1
app, with [Kamal][kamal], I hit a problem. Bundler wouldn't let me deploy
because of the following error with the pg gem: `Can't find
the 'libpq-fe.h header`.

Here's the full log output when I ran `kamal setup`:
```
% kamal setup
# .......
#16 43.33 Gem::Ext::BuildError: ERROR: Failed to build gem native extension.
#16 43.33
#16 43.33     current directory: /usr/local/bundle/ruby/3.2.0/gems/pg-1.5.4/ext
#16 43.33 /usr/local/bin/ruby extconf.rb
#16 43.33 Calling libpq with GVL unlocked
#16 43.33 checking for pg_config... no
#16 43.33 checking for libpq per pkg-config... no
#16 43.33 Using libpq from
#16 43.33 checking for libpq-fe.h... no
#16 43.33 Can't find the 'libpq-fe.h header
#16 43.33 *****************************************************************************
#16 43.33
#16 43.33 Unable to find PostgreSQL client library.
#16 43.33
#16 43.33 Please install libpq or postgresql client package like so:
#16 43.33   sudo apt install libpq-dev
# .......
# 43.33 An error occurred while installing pg (1.5.4), and Bundler cannot continue.
```

Rails 7.1 apps are generated with a standard Dockerfile. Find the following
section that installs default OS dependencies:
```sh
# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config libpq-dev
```

All you need to do is to add `libpq-dev` to the list of dependencies.
```
# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config libpq-dev \
    libpq-dev
#   ^^^ NEW DEPENDENCY
```

Then, make sure to kill your currently running DB container with:
```sh
kamal accessory remove db
```

Then re-run `kamal setup` again and the blocker will go away!
```
kamal setup
```

You can discuss this article on X/Twitter:
<br>
[https://twitter.com/kyrylosilin/status/1744384157390606396][twitter]

[synonym-sprint]: https://synonymsprint.com
[twitter]: https://twitter.com/kyrylosilin/status/1744384157390606396
[kamal]: https://kamal-deploy.org
