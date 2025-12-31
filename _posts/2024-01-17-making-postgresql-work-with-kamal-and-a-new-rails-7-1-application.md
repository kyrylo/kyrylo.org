---
layout: post
title: "Making PostgreSQL work with Kamal and a new Rails 7.1 app"
date: 2024-01-17
categories: rails kamal
image: https://imgur.com/WqXJ5lf.png
---

<img src="https://imgur.com/WqXJ5lf.png" style="margin-bottom: 1rem;">
<br>
While working on provisioning [matcharoo][matcharoo], a Rails 7.1
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

Rails 7.1 apps are generated with a standard Dockerfile.

All you need to do is add `libpq-dev` to the list of Ubuntu dependencies needed
for building gems and also to the list of packages needed for deployment.

Other distros will have their own packages.

If you add `libpq-dev` to the list of deps needed for building gems but omit
it from the list of packages needed for deployment, your app container won't
start.

It will fail with:

```
LoadError: libpq.so.5: cannot open shared object file:
No such file or directory - /usr/local/bundle/ruby/3.2.0/gems/pg-1.5.4/lib/pg_ext.so (LoadError)
```

Therefore, make sure to add `libpq-dev` to both places:

```dockerfile
# Dockerfile

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config \
    libpq-dev
#   ^^^ NEW DEPENDENCY

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libsqlite3-0 libvips \
    libpq-dev && \
#   ^^^ NEW DEPENDENCY
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
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
[https://twitter.com/kyrylosilin/status/1747921861210513422][twitter]

[matcharoo]: https://matcharoo.app
[twitter]: https://twitter.com/kyrylosilin/status/1747921861210513422
[kamal]: https://kamal-deploy.org
