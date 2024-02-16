---
layout: post
title: "How generate sitemap.xml for your Rails 7.1+ app with Kamal"
date: 2024-02-16 12:00:00 +0200
categories: rails kamal
image: https://imgur.com/FXsJinY.png
---

<img src="https://imgur.com/FXsJinY.png" style="margin-bottom: 1rem;" alt="Sitemap.xml generation with Rails and Kamal">
<br>
Rails doesn't offer a default solution for generating sitemaps. By using Kamal
and an external dependency, it is trivial to add support for sitemaps to your
Rails 7.1+ project.

## What are sitemaps?

> A sitemap is a file where you provide information about the pages, videos, and
> other files on your site, and the relationships between them. Search engines
> like Google read this file to crawl your site more efficiently
>
> [https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview][sitemaps]

## What is Kamal?

[Kamal][kamal] is a tool for deploying Rails applications. It is based on
Docker. It is the new way to deploy Rails 7.1+ apps.

## Getting started

### Installing sitemap_generator

First, we need to generate a sitemap file locally. We will use
[kjvarga/sitemap_generator][sitemap_generator] to add support for sitemaps to
your Rails app. Don't mind the date of the latest commit. The project still
works well for Rails 7.1+ apps.

Install the gem with Bundler:

```sh
bundle add sitemap_generator
```

Create the `config/sitemap.rb` file that `sitemap_generator` uses for its
configuration:

```sh
bin/rails sitemap:install
```

### Configuring sitemap_generator

Now, open the `config/sitemap.rb` file and change your `default_host` to your
host. In my case, it's [`https://matcharoo.app`][matcharoo]:

```rb
# config/sitemap.rb

# Set the host name for URL creation
SitemapGenerator::Sitemap.default_host = "https://matcharoo.app"
```

If you don't change it, then your sitemap will be pointing to example.com, and
we don't want to confuse Google's crawler.

Let's add a few pages to the sitemap so that it won't be empty (the root URL is
added by default):

```rb
# config/sitemap.rb

add "/terms"
add "/privacy"
```

We just added the "Terms of Service" and the "Privacy Policy" pages. Feel free
to add whatever page you want to be served on Google.

Note: You can use URL helpers instead of hardcoded paths.

## Generating your sitemap.xml

You can generate `sitemap.xml` with a simple task provided by the
`sitemap_generator` gem:

```sh
% bin/rails sitemap:refresh
In '/Users/kyrylo/Code/kyrylo/matcharoo/public/':
+ sitemap.xml.gz                                           1 links /  329 Bytes
Sitemap stats: 1 links / 1 sitemaps / 0m00s

Pinging with URL 'https://matcharoo.app/sitemap.xml.gz':
Ping failed for Google: #<OpenURI::HTTPError: 404 Sitemaps ping is deprecated. See https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping.> (URL http://www.google.com/webmasters/tools/ping?sitemap=https%3A%2F%2Fmatcharoo.app%2Fsitemap.xml.gz)
```

You can safely ignore the warning about the failed ping. Track the [related
issue](https://github.com/kjvarga/sitemap_generator/issues/428) in the
`sitemap_generator`'s issue tracker.

_TL;DR:_ Google removed that endpoint, and pinging is no longer necessary.

The command generated a gzipped version of your sitemap at
`public/sitemap.xml.gz`. Let's unzip it and inspect the content:

```sh
gunzip -k public/sitemap.xml.gz
```

```sh
xmllint --format public/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:pagemap="http://www.google.com/schemas/sitemap-pagemap/1.0" xmlns:xhtml="http://www.w3.org/1999/xhtml" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://matcharoo.app</loc>
    <lastmod>2024-02-16T13:06:13+02:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://matcharoo.app/terms</loc>
    <lastmod>2024-02-16T13:06:13+02:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://matcharoo.app/privacy</loc>
    <lastmod>2024-02-16T13:06:13+02:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

Everything worked as expected. Our app now supports sitemaps.

## Configuring sitemaps to work with Kamal

It would be tedious to always refresh sitemaps manually with `bin/rails
sitemap:refresh` before you deploy your app. If you deploy your app with Kamal,
there's a simple solution to that problem.

Kamal supports [hooks](https://kamal-deploy.org/docs/hooks), and we can leverage
them for this task. If you ran `kamal init` to set up Kamal, then the following
sample hooks were created for you at the root of your project:

- `.kamal/hooks/post-deploy.sample`
- `.kamal/hooks/post-traefik-reboot.sample`
- `.kamal/hooks/pre-build.sample`
- `.kamal/hooks/pre-connect.sample`
- `.kamal/hooks/pre-deploy.sample`
- `.kamal/hooks/pre-traefik-reboot.sample`

We are interested in the `.kamal/hooks/pre-build.sample` hook.

Activate the hook by changing its filename:

```sh
mv .kamal/hooks/pre-build.sample .kamal/hooks/pre-build
```

If you don't have `.kamal/hooks/pre-build.sample`, then simply create it with:

```sh
mkdir -p .kamal/hooks && touch .kamal/hooks/pre-build
```

Open the file and add the sitemap generation command there:

```sh
#!/bin/sh

RAILS_MASTER_KEY=`cat config/master.key` bin/rails sitemap:refresh
```

Note: We need to provide `RAILS_MASTER_KEY` because otherwise, the run will fail with:

```
ActiveSupport::MessageEncryptor::InvalidMessage
```

Now, when you deploy your app, this line will be run before the Docker image is
built.

Important: Make sure your sitemap is not ignored in `.dockerignore`.

### Deploying your sitemap to the server

We are done with all the configuration. Deploy your app as you normally do!

In my case, the command is the following:

```sh
kamal deploy -d production
```

```sh
Running the pre-build hook...
  INFO [11d0414b] Running /usr/bin/env .kamal/hooks/pre-build as kyrylo@localhost
 DEBUG [11d0414b] Command: ( export KAMAL_RECORDED_AT="2024-02-16T11:33:05Z" KAMAL_PERFORMER="kyrylo" KAMAL_DESTINATION="production" KAMAL_VERSION="5ca783a66ab25181e3a7554ace7a81ec6fe129d7_uncommitted_6df7cbededce5a20" KAMAL_SERVICE_VERSION="matcharoo@5ca783a66ab25181e3a7554ace7a81ec6fe129d7_uncommitted_6df7cbededce5a20" KAMAL_HOSTS="x.x.x.x,x.x.x.x" KAMAL_COMMAND="deploy" ; /usr/bin/env .kamal/hooks/pre-build )
 DEBUG [11d0414b]       In '/Users/kyrylo/Code/kyrylo/matcharoo/public/':
 DEBUG [11d0414b]       + sitemap.xml.gz                                        1964 links /    11.9 KB
 DEBUG [11d0414b]       Sitemap stats: 1,964 links / 1 sitemaps / 0m00s
 DEBUG [11d0414b]
 DEBUG [11d0414b]       Pinging with URL 'https://matcharoo.app/sitemap.xml.gz':
 DEBUG [11d0414b]       Ping failed for Google: #<OpenURI::HTTPError: 404 Sitemaps ping is deprecated. See https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping.> (URL http://www.google.com/webmasters/tools/ping?sitemap=https%3A%2F%2Fmatcharoo.app%2Fsitemap.xml.gz)
  INFO [11d0414b] Finished in 2.379 seconds with exit status 0 (successful).
```

Now that our app is deployed, check the sitemap at `https://matcharoo.app/sitemap.xml.gz`.

Download the file, unzip it, and make sure the content is what you expect it to
be.

## Submitting your sitemap to the Google Search Console

Navigate to the Search Console, find the "Indexing / Sitemaps" section, and add
your gzipped sitemap there:

<img src="https://imgur.com/c1Lw7up.png" alt="Submitted sitemap for matcharoo.app">

## Conclusion

Now, whenever you deploy your app, or edit `config/sitemap.rb` to add new
entries to the sitemap, your changes will automatically be published under
`/sitemap.xml.gz`, and Google crawlers will be fetching them periodically.

Good job!

You can discuss this article on X/Twitter:
<br>
[https://twitter.com/kyrylosilin/status/1758463466665377958][twitter]

[matcharoo]: https://matcharoo.app
[kamal]: https://kamal-deploy.org
[sitemaps]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
[sitemap_generator]: https://github.com/kjvarga/sitemap_generator
[twitter]: https://twitter.com/kyrylosilin/status/1758463466665377958
