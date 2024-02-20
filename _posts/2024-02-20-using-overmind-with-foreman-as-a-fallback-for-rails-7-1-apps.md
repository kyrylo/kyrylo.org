---
layout: post
title: "Using Overmind with Foreman as a fallback for Rails 7.1+ apps"
date: 2024-02-20 12:00:00 +0200
categories: rails overmind
image: https://imgur.com/5bmuz3q.png
---

<img src="https://imgur.com/5bmuz3q.png" style="margin-bottom: 1rem;" alt="Overmind + Foreman + Rails = Happy Team">
When you generate a new Rails 7.1 app, you have a binstub called `bin/dev`.
The binstub is responsible for launching your development tools defined in
`Procfile.dev`. By default, Rails uses [Foreman][foreman] to start your app.
[Overmind][overmind] is a better alternative to Foreman. Your project can
support both at the same time, so your team won't hate you. Here's how.

## What is Foreman?

> Manage Procfile-based applications

In a nutshell, it's a manager for any process that your Rails app needs. It
hasn't been updated in a couple of years already.

## What is Overmind?

> Overmind is a process manager for Procfile-based applications and tmux.

It's an alternative that is more advanced. It is updated more regularly, so I
recommend it to anyone starting a new Rails project.

## Co-using Overmind in your Rails project along with Foreman

### Installation

Install Overmind (macOS):

```sh
brew install overmind
```

Note: you _don't_ need to add it to your Gemfile.

### Tweak `bin/dev`

Every time I generate a new Rails 7.1 project, I replace `bin/dev` with the
following content:

```sh
#!/usr/bin/env sh

# Default to port 3000 if not specified
export PORT="${PORT:-3000}"

if command -v overmind &> /dev/null
then
  overmind start -f Procfile.dev "$@"
  exit $?
fi

if ! gem list foreman -i --silent; then
  echo "Installing foreman..."
  gem install foreman
fi

foreman start -f Procfile.dev "$@"
```

In this updated version of `bin/dev`, we added support for Overmind while still
maintaining Foreman support.

If you have Overmind installed, it will use that.

If you don't have it installed, Foreman will be used as a fallback.

Now you can open a PR against your Rails repository and be happy that your
teammates don't hate you if they prefer Foreman instead.

[foreman]: https://github.com/ddollar/foreman
[overmind]: https://github.com/DarthSim/overmind
