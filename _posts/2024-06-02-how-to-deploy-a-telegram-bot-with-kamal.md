---
layout: post
title: "How to build and deploy a Telegram bot with Kamal"
date: 2024-06-02 00:00:00 +0200
categories: telegram kamal
---

There are many great tutorials on how to write Telegram bots, but almost none of
them cover how to deploy a Telegram bot. In this article, we will write a simple
Telegram bot and deploy it with [Kamal](https://kamal-deploy.org). It will run
in a Docker container exposed via Traefik.

Telegram has been getting more interest from developers all over the world
recently. It's not surprising because it offers an excellent [Bot API][bot-api],
which anyone can use to build their own bot for free.

A bot (chatbot) is a program that interacts with users on Telegram. Telegram
bots automate tasks such as sending notifications, providing customer service,
and more.

The bot that we will write will be a simple echo bot written in Go. Writing
advanced Telegram bots is out of scope for this article; I will focus on the
deployment part instead.

The bot will be deployed on a simple VPS and exposed to the internet. It will be
configured to [receive updates via webhooks][webhooks].

## Preparational steps

There are a few important details that we must take care of prior to starting to
build and deploy our bot:

1. **You _must_ own a domain name so that Let's Encrypt can issue you a free SSL
   certificate**

   We will use Let's Encrypt because it's the standard way of deploying Kamal
   apps. If you don't own a domain name, you can use your IP address to deploy,
   but the configuration will be more involved. I will not cover it in this
   article

2. **Telegram bots can get new updates either via long-polling or webhooks.
   These two methods are completely different**

   With long-polling, your bot will be asking Telegram servers whether there's a
   new update. With webhooks, Telegram will be sending a POST request to your
   bot. We will use webhooks because this method is more scalable and works
   perfectly with Kamal

3. **I am going to create a subdomain specifically for listening to Telegram
   webhooks**

   This works really well from a simplicity standpoint. Only a minimal
   configuration is needed to make it work. I use Cloudflare to manage my
   domains. It's likely that you are the same. In that case, just add your
   subdomain as an `A` record that points to your VPS that hosts your Telegram
   bot:

   ![](https://imgur.com/eOFUN82.png)

4. **Because Kamal uses Docker images, you need to use a Docker registry**

   I use [Docker Hub][docker-hub] to host the image for the Telegram bot. Make
   sure to create a new repository. In my case, I called it
   `kyrylo/telegram-echo-bot`. This is no different from deploying a Rails app
   with Kamal

## Writing a Telegram echo bot

An echo bot is a bot that simply returns (echoes) the input it sees. It's not
really useful in daily life, but it is great for demonstration purposes, since
the focus of the article is to show how to deploy _any_ Telegram bot using
Kamal.

Let's initialize a new Go project with `go mod init`:

```sh
go mod init github.com/kyrylo/telegram-echo-bot
```

We will need a Telegram Bot API wrapper. There are many libraries to choose from
for different programming languages. I am writing the bot in Go, and I prefer
[github.com/tucnak/telebot][telebot].

Let's import it as our dependency:

```sh
go get -u gopkg.in/telebot.v3
```

Now, let's create `main.go` and write our echo bot (it takes only a few lines of
code):

```go
// main.go
package main

import (
	"log"
	"os"

	tele "gopkg.in/telebot.v3"
)

func main() {
	pref := tele.Settings{
		Token: os.Getenv("TELEGRAM_BOT_TOKEN"),
		Poller: &tele.Webhook{
			Listen: "0.0.0.0:3000",
			Endpoint: &tele.WebhookEndpoint{
				PublicURL: os.Getenv("TELEGRAM_BOT_WEBHOOK_URL"),
			},
		},
	}

	b, err := tele.NewBot(pref)
	if err != nil {
		log.Fatal(err)
		return
	}

	b.Handle(tele.OnText, func(c tele.Context) error {
		return c.Send(c.Message().Text)
	})

	b.Start()
}
```

This bot simply reads any text that it sees and posts it back at you. There are
two environment variables that we need to take care of:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_WEBHOOK_URL`

#### TELEGRAM_BOT_TOKEN

`TELEGRAM_BOT_TOKEN` is your unique token that [`@BotFather`][botfather] gives
you when you create a new bot. It should not be exposed, so keep it safe.

Let's create a new bot and obtain the token:

1. Type `/newbot` into the direct message window with [`@BotFather`][botfather]
2. Specify the bot name: `Echobot`
3. Specify the bot username: Echo123Bot (it must be unique, so add some random
   numbers)
4. @BotFather returned a token that we need to use in our program: `7473228208:AAFcsA8_g6twHICkBJtnAnWITZNKy26lj1w`

Leave the token there for now. We will get back to it later in the article.

#### TELEGRAM_BOT_WEBHOOK_URL

As I mentioned previously, on a new update (a new event that the bot "saw"),
Telegram will POST it as a webhook. `TELEGRAM_BOT_WEBHOOK_URL` controls the
address that Telegram will post to. Your bot listens to this address and
processes the incoming payload. There are many events that could be handled.
Here are some of them:

- a user posted a new message
- someone was invited to the channel
- someone was kicked from the channel
- [and many more][update]

`TELEGRAM_BOT_WEBHOOK_URL` must be publicly accessible and encrypted via
SSL/TLS. Telegram has [a detailed list of requirements][webhooks] that we will
omit in this article. Kamal and Traefik solve most of those headaches.

We will set the value of `TELEGRAM_BOT_WEBHOOK_URL` to your subdomain later in
the article. Let's move on for now.

### Building a Docker image

In order to deploy something with Kamal, it needs to be containerized. Let's
package our Telegram bot into a Docker image. Here's what its Dockerfile will
look like:

```Dockerfile
# Dockerfile
FROM golang:1.22.3-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o ./echo-bot

FROM alpine:3.12 AS run
RUN apk --no-cache add curl
COPY --from=build /app/echo-bot /app/echo-bot
WORKDIR /app
EXPOSE 3000
CMD ["./echo-bot"]
```

This looks pretty standard. We add `curl` for healthchecks and expose port 3000
to listen to. Traefik will forward updates to this port. Healthchecks are
performed on port 3000 as well, so we don't need to configure anything special
in the Kamal deploy config.

Let's build it locally and verify that it works:

```sh
docker build -t echo-bot:latest .
```

```sh
docker images | grep echo-bot
echo-bot                       latest             49dc8cfb20ff   About a minute ago   15.9MB
```

Nice! Now we can run it and see it fail:

```sh
docker run echo-bot
2024/06/01 08:33:13 telegram: Not Found (404)
```

The "Not Found" output is from our bot. This is expected, because we didn't set
our environment variables in the previous section.

## Setting up Kamal

We are done developing and packaging the bot. Now it's time to deploy it to
production with [Kamal][kamal].

Install Kamal if you haven't done so yet:

```sh
gem install kamal
```

Let's create the Kamal config stubs:

```
kamal init
```

Populate `config/deploy.yml` with the following content:

```yml
# config/deploy.yml
service: telegram-echo-bot
image: kyrylo/telegram-echo-bot
servers:
  web:
    hosts:
      - your-vps-ip
    labels:
      traefik.http.routers.telegram-echo-bot-web.entrypoints: websecure
      traefik.http.routers.telegram-echo-bot-web.rule: Host(`telegram.example.com`)
      traefik.http.routers.telegram-echo-bot-web.tls.certresolver: letsencrypt
    env:
      clear:
        TELEGRAM_BOT_WEBHOOK_URL: "https://telegram.example.com/"
      secret:
        - TELEGRAM_BOT_TOKEN

registry:
  username: kyrylo
  password:
    - KAMAL_REGISTRY_PASSWORD

traefik:
  options:
    publish:
      - "443:443"
    volume:
      - "/letsencrypt/acme.json:/letsencrypt/acme.json"
  args:
    accesslog: true
    entryPoints.web.address: ":80"
    entryPoints.websecure.address: ":443"
    entryPoints.web.http.redirections.entryPoint.to: websecure
    entryPoints.web.http.redirections.entryPoint.scheme: https
    entryPoints.web.http.redirections.entrypoint.permanent: true
    certificatesResolvers.letsencrypt.acme.email: "help@example.com"
    certificatesResolvers.letsencrypt.acme.storage: "/letsencrypt/acme.json"
    certificatesResolvers.letsencrypt.acme.httpchallenge: true
    certificatesResolvers.letsencrypt.acme.httpchallenge.entrypoint: web
```

Steps to make this config work for you:

- replace "your-vps-ip" with the actual IP of your VPS
- update the `TELEGRAM_BOT_WEBHOOK_URL` env variable with your URL that you
  prepared earlier
- SSL is configured via Let's Encrypt (almost every other Kamal tutorial uses
  this, so no surprises here)
- update `certificatesResolvers.letsencrypt.acme.email` to an email under your
  `domain` (example.com won't work!)

Now, populate `.env` with your:

- `KAMAL_REGISTRY_PASSWORD` - usually, your Docker Hub password
- `TELEGRAM_BOT_TOKEN` - copy it from [@BotFather][botfather]

```
KAMAL_REGISTRY_PASSWORD=your-registry-password
TELEGRAM_BOT_TOKEN=7473228208:AAFcsA8_g6twHICkBJtnAnWITZNKy26lj1w
```

**Note:** Kamal generates `RAILS_MASTER_KEY` in `.env` automatically. You don't need
that, so simply delete it.

## Deploying with Kamal

In order to deploy with Kamal, we need to initialize a Git repository first:

```sh
git init
```

Let's add `.env` to `.gitignore` and `.dockerignore` so that we don't leak our
credentials.

```sh
echo ".env" | tee -a .gitignore .dockerignore
```

We are good to commit:

```sh
git add .
git commit -m "Initial commit"
```

SSH into your VPS and add an empty `acme.json` file for Let's Encrypt.

```sh
ssh your-server
mkdir /letsencrypt
touch /letsencrypt/acme.json
chmod 600 /letsencrypt/acme.json
```

You can close your SSH session now. We won't need it anymore. Use Kamal to
provision your VPS with environment variables:

```sh
kamal env push
```

Now we can build and deploy our image. We use `setup` here so that Kamal can
install Docker on the VPS, too:

```sh
kamal setup
```

When the setup is done (it may take a couple of minutes), we want to ensure that
everything is up and running. Let's check if the bot is running:

```sh
kamal app details
```

```
  INFO [45c1383f] Running docker ps --filter label=service=telegram-echo-bot --filter label=role=web on your-vps-ip
  INFO [45c1383f] Finished in 0.582 seconds with exit status 0 (successful).
App Host: your-vps-ip
CONTAINER ID   IMAGE                                                               COMMAND        CREATED         STATUS                   PORTS      NAMES
50e9eed6da21   kyrylo/telegram-echo-bot:2289664e47cbd4927baf3f5d9d0070601cc039bc   "./echo-bot"   3 minutes ago   Up 3 minutes (healthy)   3000/tcp   telegram-echo-bot-web-2289664e47cbd4927baf3f5d9d0070601cc039bc
```

All good. Now, let's check if traefik is running:

```sh
kamal traefik details
```

```
  INFO [b97db9aa] Running docker ps --filter name=^traefik$ on your-vps-ip
  INFO [b97db9aa] Finished in 0.652 seconds with exit status 0 (successful).
Traefik Host: your-vps-ip
CONTAINER ID   IMAGE           COMMAND                  CREATED         STATUS         PORTS                                                                      NAMES
296f82ec2374   traefik:v2.10   "/entrypoint.sh --pr…"   3 minutes ago   Up 3 minutes   0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:443->443/tcp, :::443->443/tcp   traefik
```

Our echo bot is successfully deployed! But does it actually work?

## Testing the echo bot

First, we want to verify that the webhook for the bot was set successfully. To
do that, we need to visit:

```
https://api.telegram.org/bot<telegram_bot_token>/getWebhookInfo
```

Substitute your bot token. In my case, the URL was the following:
[https://api.telegram.org/bot7473228208:AAFcsA8_g6twHICkBJtnAnWITZNKy26lj1w/getWebhookInfo][getwebhookinfo]

The response should look like this:

```sh
 curl -s https://api.telegram.org/bot7473228208:AAFcsA8_g6twHICkBJtnAnWITZNKy26lj1w/getWebhookInfo | jq
```

```json
{
  "ok": true,
  "result": {
    "url": "https://telegram.example.com/",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "104.21.14.82"
  }
}
```

Next, go to Telegram and search for your bot's username. In my case, it's
`@Echo12485853Bot`.

<img style="max-width: 350px" src="https://imgur.com/cOBm1eU.png">

Now you can press `Start` and type something. You will see the bot echoing back
at you your own messages:

<img style="max-width: 350px" src="https://imgur.com/0uBHqAc.png">

Congratulations! You deployed your Telegram bot to a VPS with Kamal 🎉
Yes, it was that easy 😎

[bot-api]: https://core.telegram.org/bots/api
[kamal]: https://kamal-deploy.org
[telebot]: https://github.com/tucnak/telebot
[botfather]: tg://resolve?domain=BotFather
[webhooks]: https://core.telegram.org/bots/webhooks
[docker-hub]: https://hub.docker.com
[update]: https://core.telegram.org/bots/api#update
[getwebhookinfo]: https://api.telegram.org/bot7473228208:AAFcsA8_g6twHICkBJtnAnWITZNKy26lj1w/getWebhookInfo
