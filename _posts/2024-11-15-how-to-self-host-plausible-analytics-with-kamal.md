---
layout: post
title: How to self-host Plausible Analytics with Kamal
date: 2024-11-15 12:00:00 +0200
categories: kamal
image: assets/images/kyrylo-silin@2x.webp
redirect_from:
  - /kamal/2024/10/29/how-to-self-host-plausible-tanalytics-with-kamal.html
  - /kamal/2024/11/14/how-to-self-host-plausible-tanalytics-with-kamal.html
---

In this article, I'll guide you through the process of self-hosting [Plausible
Analytics](https://plausible.io/) with Kamal. It's a simple, lightweight
alternative to Google Analytics.

I've been trial-running it for a while now and really like it because it's
straightforward and not overwhelming to use (I can now see my visitors beyond
the 30-minute mark `;-)`). Since my trial period is ending soon, it was high
time to decide what to do.

You can either use Plausible in the cloud or self-host it. I chose to self-host
it because [Kamal](https://kamal-deploy.org/) makes it a breeze, and the
requirements are minimal.

## Requirements

### Hardware

We'll be working with the [Plausible Community
Edition](https://github.com/plausible/community-edition/). The hardware
requirements are minimal. If you have modest needs like me, you can run it on
the cheapest [Hetzner Cloud](https://hetzner.com/cloud) instance:

<blockquote cite="https://github.com/plausible/community-edition/blob/v2.1.4/README.md#prerequisites">
  <p>
    Prerequisites:
  </p>
  <ul>
    <li>CPU must support SSE 4.2 or NEON instruction set or higher (required by ClickHouse).</li>
    <li>At least 2 GB of RAM is recommended for running ClickHouse and Plausible without fear of OOMs.</li>
  </ul>
</blockquote>

### Subdomain

An ideal setup would involve using a subdomain for Plausible, e.g.,
`plausible.example.com`.

On Cloudflare, you can create an `A` record pointing to your server's IP address. This will allow you to access Plausible at `https://plausible.example.com`.

![Cloudflare DNS settings](https://cdn.kyrylo.org/images/2024-11-15-2.webp)

### ghcr.io token

To pull the Plausible Community Edition Docker image, you'll need a [GitHub
Container Registry (ghcr.io)](https://github.blog/news-insights/product-news/introducing-github-container-registry/)
token.

You can create one in your GitHub account settings:

![New fine-grained personal access token on GitHub](https://cdn.kyrylo.org/images/2024-11-15-1.webp)

1. Go to `Settings` > `Developer settings` > `Personal access tokens` > [`Fine-grained tokens`](https://github.com/settings/personal-access-tokens/new)
2. Keep all the default settings.
3. Give it a name, e.g. `ghcr-plausible-kamal`.
4. Make it non-expiring (I prefer this, but it's up to you).
5. Hit `Generate token`.

Copy the token and store it in a safe place—you'll need it later.

## Step-by-step guide

To understand what we’ll be doing, let’s examine the
[compose.yml](https://github.com/plausible/community-edition/blob/v2.1.4/compose.yml)
file from the Plausible Community Edition repository and translate it to a Kamal
configuration.

Plausible requires two dependencies (databases):

- ClickHouse
- PostgreSQL

The main web service is Plausible itself, and we’ll pull the Docker image from
the GitHub Container Registry.

With that, let’s get started!

### Step 1: Clone Plausible config files

Start by cloning the repository:

```sh
git clone -b v2.1.4 --single-branch https://github.com/plausible/community-edition plausible-kamal
cd plausible-kamal
```

The directory name we’ll use locally is `plausible-kamal`. I recommend either
forking the repository or creating a new one and pushing your changes there. I
chose the latter, but it’s up to you.

### Step 2: Update `.gitignore`

The repository includes a `.gitignore` file that allowlists files. We need to
update it to commit the Kamal configuration files:

```
# .gitignore
!.kamal
!.kamal/secrets
!.config
!config/deploy.yml
```

You can safely skip committing hooks; they’re unnecessary. While we’re here, let’s also allow the `Dockerfile`. More on that later:

```
# .gitignore
!Dockerfile
```

Here’s the complete `.gitignore`:

```gitignore
*
!compose.yml
!clickhouse/logs.xml
!clickhouse/ipv4-only.xml
!README.md
!.gitignore
!.kamal
!.kamal/secrets
!config
!config/deploy.yml
!Dockerfile
```

Commit these changes so the new `.gitignore` rules are applied:

```sh
git add .gitignore
git commit -m "Allow Kamal configuration files + Dockerfile"
```

### Step 3: Generate Kamal configuration

If you don't have Kamal installed, you can install it via [RubyGems](https://rubygems.org):

```sh
gem install kamal
```

Now, generate Kamal configuration:

```sh
% kamal init
Created configuration file in config/deploy.yml
Created .kamal/secrets file
Created sample hooks in .kamal/hooks
```

### Step 4: Create a dummy Dockerfile

Currently, Kamal [doesn't support](https://github.com/basecamp/kamal/issues/497)
deploying public Docker images directly. As a workaround, we’ll create a dummy
Dockerfile that "wraps" the Plausible Docker image:

```Dockerfile
% echo "FROM ghcr.io/plausible/community-edition:v2.1.4" > Dockerfile
```

### Step 5: Log into GitHub Container Registry

This is where the GitHub Container Registry token comes in. For my Kamal
registry, I use Docker Hub, but Plausible is hosted on GitHub Container
Registry, so we need to log in manually:

```sh
echo <github_token> | docker login ghcr.io -u kyrylo --password-stdin
```

### Step 6: Setting up Kamal secrets

Plausible requires several mandatory environment variables:

- `SECRET_KEY_BASE`: <q>Configures the secret used for sessions in the dashboard
  and for generating other secrets like TOTP Vault Key.</q>
- `BASE_URL`: <q>Configures the base URL to use in link generation and Cross-Site
  WebSocket Hijacking (CSWSH) checks.</q>

We also need database passwords:

- `POSTGRES_PASSWORD`: For PostgreSQL.
- `CLICKHOUSE_PASSWORD`: For ClickHouse.

Finally, don't forget to set the `KAMAL_REGISTRY_PASSWORD`. If you're using
GitHub Container Registry, set it to the GitHub token we used earlier.
Otherwise, use your Docker Hub password or token.

Here’s how your `config/secrets` should look like:

```sh
# config/secrets
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
SECRET_KEY_BASE=$SECRET_KEY_BASE
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD
```

For brevity, I'll populate these secrets with values from the environment—it's
the easiest way. There are more options available in Kamal's
[documentation](https://kamal-deploy.org/docs/commands/secrets/).

```sh
# Somewhere in your shell configuration
export KAMAL_REGISTRY_PASSWORD=<your Docker registry password/token>
export SECRET_KEY_BASE=$(openssl rand -base64 48)
export POSTGRES_PASSWORD=postgres
export CLICKHOUSE_PASSWORD=
```

`SECRET_KEY_BASE` is generated randomly. Make sure not to lose it after it's
generated and used!

`CLICKHOUSE_PASSWORD` can be left empty; it's not mandatory to set it.

`POSTGRES_PASSWORD` can be set to anything you like; I set it to `postgres`.

We're done with the secrets! Now, we just need to set some environment variables
in the Kamal configuration.

### Step 7: Update Kamal configuration

We're almost there! Let's update the Kamal configuration file. I'll walk you
through the key sections and, at the end, provide the full configuration so you
can easily copy-paste it and adjust it to your needs.

First, let's set the service name and image. We'll use the custom image we
created in Step 4.

```yaml
service: plausible
image: <your name>/plausible
```

Next, we need to define the servers. We'll have just one server, named `web`,
and specify the command to run, copied directly from `compose.yml`:

```yaml
servers:
  web:
    hosts:
      - <your-server-ip>
    cmd: sh -c "/entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
```

Now, let's configure the [kamal-proxy](https://github.com/basecamp/kamal-proxy)
settings to enable SSL for our Plausible instance. We'll use the subdomain
created earlier. **Important:** Plausible runs on port `8000`, but kamal-proxy
expects the app to run on port `3000` by default. So, we need to set the correct
port:

```yaml
proxy:
  ssl: true
  host: plausible.example.com
  app_port: 8000
```

Next, we'll define the environment variables for the web service. We'll set
`BASE_URL`, `DATABASE_URL`, and `CLICKHOUSE_DATABASE_URL` as clear variables, while
`SECRET_KEY_BASE` will be pulled from the secrets file.

The `DATABASE_URL` and `CLICKHOUSE_DATABASE_URL` connection strings point to
hosts that Docker will resolve. The hostnames `plausible-db` and
`plausible-events-db` are derived from the service name (`plausible`) and the
accessory name (`db` or `events-db`). For example, `plausible-db` will be used
as the host for PostgreSQL.

Let's set the environment variables:

```yaml
env:
  clear:
    BASE_URL: https://plausible.example.com
    DATABASE_URL: postgres://postgres:postgres@plausible-db:5432/plausible_db
    CLICKHOUSE_DATABASE_URL: http://plausible-events-db:8123/plausible_events_db
  secret:
    - SECRET_KEY_BASE
```

Now, let's define the accessories. We need two: `db` and `events-db`.

The `db` accessory is a PostgreSQL database. Pay attention to the port
declaration. Instead of `port: 5432`, we use port: `127.0.0.1:5432:5432` to
ensure the database isn't exposed to the outside world.

```yaml
accessories:
  db:
    image: postgres:16-alpine
    host: <your-ip>
    port: "127.0.0.1:5432:5432"
    env:
      secret:
        - POSTGRES_PASSWORD
    directories:
      - db-data:/var/lib/postgresql/data
```

The `events-db` accessory is a ClickHouse database. We follow the same pattern
as with PostgreSQL. Additionally, we copy configuration files to the ClickHouse
container from the Plausible Community Edition repository.

```yaml
events-db:
  image: clickhouse/clickhouse-server:24.3.3.102-alpine
  host: <your-ip>
  port: "127.0.0.1:8123:8123"
  env:
    secret:
      - CLICKHOUSE_PASSWORD
  directories:
    - event-data:/var/lib/clickhouse
    - event-logs:/var/log/clickhouse-server
  files:
    - ./clickhouse/logs.xml:/etc/clickhouse-server/config.d/logs.xml:ro
    # This makes ClickHouse bind to IPv4 only, since Docker doesn't enable IPv6 in bridge networks by default.
    # Fixes "Listen [::]:9000 failed: Address family for hostname not supported" warnings.
    - ./clickhouse/ipv4-only.xml:/etc/clickhouse-server/config.d/ipv4-only.xml:ro
```

And we're done! Here's the full configuration:

```yaml
# config/deploy.yml
service: plausible
image: <your name>/plausible

servers:
  web:
    hosts:
      - <your-ip>
    cmd: sh -c "/entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
proxy:
  ssl: true
  host: plausible.<example.com>
  app_port: 8000

registry:
  username: <your name>
  password:
    - KAMAL_REGISTRY_PASSWORD

builder:
  arch: amd64

env:
  clear:
    BASE_URL: https://plausible.<example.com>
    DATABASE_URL: postgres://postgres:postgres@plausible-db:5432/plausible_db
    CLICKHOUSE_DATABASE_URL: http://plausible-events-db:8123/plausible_events_db
  secret:
    - SECRET_KEY_BASE

accessories:
  db:
    image: postgres:16-alpine
    host: <your-ip>
    port: "127.0.0.1:5432:5432"
    env:
      secret:
        - POSTGRES_PASSWORD
    directories:
      - db-data:/var/lib/postgresql/data

  events-db:
    image: clickhouse/clickhouse-server:24.3.3.102-alpine
    host: <your-ip>
    port: "127.0.0.1:8123:8123"
    env:
      secret:
        - CLICKHOUSE_PASSWORD
    directories:
      - event-data:/var/lib/clickhouse
      - event-logs:/var/log/clickhouse-server
    files:
      - ./clickhouse/logs.xml:/etc/clickhouse-server/config.d/logs.xml:ro
      # This makes ClickHouse bind to IPv4 only, since Docker doesn't enable IPv6 in bridge networks by default.
      # Fixes "Listen [::]:9000 failed: Address family for hostname not supported" warnings.
      - ./clickhouse/ipv4-only.xml:/etc/clickhouse-server/config.d/ipv4-only.xml:ro
```

To verify that the configuration is correct, run:

```sh
% kamal config
```

Wonderful! If everything looks good, commit your changes:

```sh
git add .
git commit -m "Add Kamal configuration"
```

### Step 8: Deploy Plausible

I deployed Plausible on a server that had already been provisioned with Kamal.
If you're using a fresh server, you’ll likely want to run `kamal setup` and be
done.

In my case, the server was already running Kamal containers, so I needed to boot
my accessories first. I did this with the following command[^1]:

```sh
% kamal accessory boot all
```

Then, I deployed the service:

```sh
% kamal deploy
```

This will take a minute or two to create the databases and tables, and it will
then crash happily with the following error:

```
Error: target failed to become healthy
```

Don't panic! I’m not sure why, but if you run `kamal deploy` again, it will work
as expected:

```sh
% kamal deploy
```

Once everything is successful, you should be able to visit
<code>https://plausible.example.com</code> and see the Plausible sign-up page.
Congratulations, you've just self-hosted Plausible Analytics with Kamal! I'm
proud of you!

![Plausible sign-up page](https://cdn.kyrylo.org/images/2024-11-15-3.webp)

[^1]:
    If your Kamal version is different from the one you previously used, ensure you match it. As of writing, the latest version is `2.3.0`, but my old server was provisioned with version `2.2.2`.

    To address this, specify the version inline:

    ```sh
    kamal _2.2.2_ deploy
    ```
