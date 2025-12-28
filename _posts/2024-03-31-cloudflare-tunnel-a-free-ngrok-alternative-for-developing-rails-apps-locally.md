---
layout: post
title: "Cloudflare Tunnel: a free ngrok alternative for exposing local Rails apps to the internet"
date: 2024-03-31 12:00:00 +0200
categories: rails
redirect_from:
  - /rails/2024/03/30/cloudflare-tunnel-a-free-ngrok-alternative-for-developing-rails-apps-locally
---

Imagine you want to test a new page that you just wrote the code for against a
real mobile device. You don't want to push it into production without testing
it. You somehow need to expose your local Rails server to the internet so that
you (or anyone else) could test it before it goes live.

These is a very common problem. Luckily, it's been solved already. My go-to tool
for this was [ngrok][ngrok] or [localtunnel][localtunnel]. Both of these tools
are great, but they didn't fit my needs perfectly.

Ngrok is very advanced, but I don't need all of its features. The feature that I
need is a static domain name, so that I can expose my local Rails app to the
same address. On the free version, ngrok binds to a subdomain assigned to you
randomly. A static domain name is a must if you want to save time developing
your app.

Localtunnel is an open-source alternative to ngrok that allows you to do just
that:

```sh
lt --port 3000 --subdomain=telebugs --print-requests
```

There are a bunch of problems with localtunnel, though:

1. It's not maintained anymore, although it still works
2. [Downtimes do happen](https://github.com/localtunnel/localtunnel/issues/619)
3. Sometimes, the tunnel just crashes, or your [subdomain doesn't get bound](https://github.com/localtunnel/localtunnel/issues/248)

   To address the former, I wrapped my localtunnel in a `while` loop like this:

   ```sh
   while true; do lt --port 3000 --subdomain=telebugs --print-requests; sleep 1; done
   ```

4. Anyone can hijack the subdomain that you use when your tunnel is not active.

   In fact, this happened to me last year, so I had to choose another subdomain:

   <blockquote class="twitter-tweet"><p lang="en" dir="ltr">Welp, crypto bros have &quot;hijacked&quot; my localtunnel subdomain that I&#39;ve been using for Synonym Sprint.<br><br>I had to choose a new name instead.<br><br>It happened yesterday, and I thought maybe today it would be free again, but no, it is still running.<br><br>It&#39;s not a big deal, since changing is… <a href="https://t.co/G9eL8Lq4Hq">pic.twitter.com/G9eL8Lq4Hq</a></p>&mdash; Kyrylo Silin (@kyrylosilin) <a href="https://twitter.com/kyrylosilin/status/1740650930842878247?ref_src=twsrc%5Etfw">December 29, 2023</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Meet the Cloudflare Tunnel

> Your domain name must be managed by Cloudflare. Otherwise, this tutorial
> _will not work_ for you.

Why would you go through all these struggles, when around the corner, there's a
better alternative that solves all our problems?

Without further ado, let's replace ngrok/localtunnel with
[Cloudflare Tunnel][cftunnel] in our Rails 7 app!

### Installation

Let's [install](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) the `cloudflared` CLI app. On macOS, it's as simple as:

```sh
brew install cloudflared
```

Confirm that it's installed via:

```sh
% cloudflared --version
cloudflared version 2024.3.0 (built 2024-03-19T18:08:31Z)
```

### Create a new tunnel

First, you need to log into your Cloudflare account via `cloudflared` so that
you can manage CF tunnels via the CLI:

```sh
% cloudflared tunnel login
A browser window should have opened at the following URL:

https://dash.cloudflare.com/argotunnel?aud=&callback=https%3A%2F%2Flogin.cloudflareaccess.org%2F0n1R7UqQdRd7vR3D4CT3D4wzHoB0-63_RZ63vSVzIhakw%3D

If the browser failed to open, please visit the URL above directly in your browser.
You have successfully logged in.
If you wish to copy your credentials to a server, they have been saved to:
/Users/kyrylo/.cloudflared/cert.pem
```

Choose the domain for your Rails app and click "Authorize". That's all!

<img src="https://imgur.com/Ao4vTap.png" style="height: 500px" alt="Authorize Cloudflare Tunnel">

If `cloudflared tunnel login` didn't print a link, don't worry. Just continue
reading.

Now, you need to create a named tunnel. I will name my tunnel `telebugs`:

```sh
% cloudflared tunnel create telebugs
Tunnel credentials written to /Users/kyrylo/.cloudflared/3de42678-313b-4801-bd71-1e4dda81880b.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel telebugs with id 3de42678-313b-4801-bd71-1e4dda81880b
```

You will use that tunnel to access your local Rails app. Now you need to update
your DNS records to point to that tunnel. Choose a subdomain that you would like
to use to access your local Rails app. `localhost` seems like a good choice:
it's easy to understand, and it's unlikely you will want it for your production
needs.

```sh
% cloudflared tunnel route dns telebugs localhost.telebugs.com
2024-03-31T09:59:33Z INF Added CNAME localhost.telebugs.com which will route to this tunnel tunnelID=3de42678-313b-4801-bd71-1e4dda81880b
```

Go to your DNS settings for the Cloudflare domain you use and verify that the
Tunnel CNAME record was added.

If not, then add a new `CNAME` record manually. The target should be the tunnel
ID you received when you created the tunnel plus `.cfargotunnel.com`. In my
case, it's `3de42678-313b-4801-bd71-1e4dda81880b.cfargotunnel.com`:

<img src="https://imgur.com/DQDGKaV.png" alt="DNS settings. Adding the Cloudflare Tunnel CNAME">

### Configure your Rails app to use the tunnel

Create `config/cloudflare-tunnel.yml` with the following contents:

```yml
# config/clouflare-tunnel.yml
tunnel: 3de42678-313b-4801-bd71-1e4dda81880b
credentials-file: /Users/kyrylo/.cloudflared/3de42678-313b-4801-bd71-1e4dda81880b.json

ingress:
  - hostname: localhost.telebugs.com
    service: http://localhost:3000
  - service: http_status:404
```

Note: you must use the full path for `credentials-file`. Cloudflare will not
expand `$HOME` or `~/` for you, so
`~/.cloudflared/3de42678-313b-4801-bd71-1e4dda81880b.json` _will_ fail:

```sh
Tunnel credentials file '~/.cloudflared/3de42678-313b-4801-bd71-1e4dda81880b.json' doesn't exist or is not a file
```

Next, validate the tunnel's ingress:

```sh
% cloudflared tunnel --config config/cloudflare-tunnel.yml ingress validate telebugs
Validating rules from config/cloudflare-tunnel.yml
OK
```

Ok, we're all good. Now we can add this file to `.gitignore`, copy its contents
to `config/cloudflare-tunnel.yml.example`, redact `tunnel` and
`credentials-file` values, and track it with `git`:

```sh
% echo config/cloudflare-tunnel.yml >> .gitignore
```

```sh
% cp config/cloudflare-tunnel.yml config/cloudflare-tunnel.yml.example
```

```sh
# config/clouflare-tunnel.yml.example
tunnel: CHANGE_ME
credentials-file: CHANGE_ME

ingress:
  - hostname: localhost.telebugs.com
    service: http://localhost:3000
  - service: http_status:404
```

```sh
git add config/clouflare-tunnel.yml.example
```

One last thing we need to do is add `localhost.telebugs.com` to the list of
allowed domains so that Rack doesn't block it:

```rb
# config/environments/development.rb

Rails.application.configure do
  config.hosts << "localhost.telebugs.com"
end
```

### Run the tunnel

Awesome! We can now start using our tunnel. Let's confirm that it works:

```sh
% cloudflared tunnel --url localhost:3000 --config config/cloudflare-tunnel.yml run telebugs
2024-03-31T11:19:10Z INF Starting tunnel tunnelID=3de42678-313b-4801-bd71-1e4dda81880b
```

Now, make sure your local Rails app is running, navigate to
[`https://localhost.telebugs.com`](https://telebugs.com) (use your own domain), and verify that your
local Rails server gets hit.

```sh
% curl -I https://localhost.telebugs.com
HTTP/2 200
```

Nice! We're almost done!

Starting the tunnel every time is a hassle, so add it to the `Procfile`, so that
it is started automatically every time you launch your Rails app locally.

Edit `Procfile` and add the following:

```sh
# Procfile
tunnel: cloudflared tunnel --url localhost:3000 --config config/cloudflare-tunnel.yml run telebugs
```

Now, every time you run `bin/dev`, your Rails 7 application will start the
tunnel, and you will be able to access your local server from anywhere on the
internet. For free!

Was the article helpful? [Follow me on X/Twitter](https://x.com/kyrylo)
where I post daily about my indie hacking journey and the projects I work on.
You can discuss this article on X/Twitter, too:
[https://twitter.com/kyrylosilin/status/1774406300295717101](https://twitter.com/kyrylosilin/status/1774406300295717101)

[ngrok]: https://ngrok.com
[localtunnel]: https://github.com/localtunnel/localtunnel
[cftunnel]: https://www.cloudflare.com/products/tunnel/
