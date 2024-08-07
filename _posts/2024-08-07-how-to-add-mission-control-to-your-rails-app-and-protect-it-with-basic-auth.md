---
layout: post
title: "How to add Mission Control to your Rails app and protect it with Basic Auth"
date: 2024-08-07 12:00:00 +0200
categories: rails
image: https://i.imgur.com/hGcMSGV.png
---

<img src="https://i.imgur.com/hGcMSGV.png" style="margin-bottom: 1rem; width: 75%;" alt="Mission Control dashboard">
<br>
[Mission Control](https://github.com/rails/mission_control-jobs) is a powerful
tool for monitoring and managing your Rails jobs in real-time. It offers
insights into your app's performance and errors. In this tutorial, I'll show you
how to integrate Mission Control into your Rails app and secure it with Basic
Auth.

## Installation

To get started, add the Mission Control gem to your Rails application's
`Gemfile`:

```sh
bundle add mission_control-jobs
```

Next, you need to mount Mission Control's engine in your routes.rb file. This
will make the Mission Control UI accessible from your application:

```rb
# config/routes.rb

Rails.application.routes.draw do
  mount MissionControl::Jobs::Engine, at: "/jobs"
end
```

With this configuration, you can now access Mission Control’s UI at `/jobs`,
where you can browse queues, inspect jobs, and manage failed jobs.

## Securing Mission Control with Basic Auth

To protect the Mission Control interface, it’s a good idea to add
authentication. By default, Mission Control's controllers extend your
application's `ApplicationController`. If your app doesn't enforce
authentication, **anyone can access** [`/jobs`](http://localhost:3000/jobs). To
secure this, you can specify a different base controller class that includes
authentication.

First, create an `MissionControlController` with [basic authentication](https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Basic.html):

```rb
# app/controllers/mission_control_controller.rb

class MissionControlController < ApplicationController
  http_basic_authenticate_with(
    name: "admin",
    password: "admin"
  )
end
```

Next, configure Mission Control to use this controller as its base class. Add
the following to your `config/application.rb`:

```rb
# config/application.rb

config.mission_control.jobs.base_controller_class = "MissionControlController"
```

Alternatively, you can add this configuration to a specific environment file,
like `config/environments/production.rb`, to only enable authentication in
production.

Now, when you access
[`/jobs`](`http://localhost:3000/jobs`), you'll be prompted
to enter the username and password you specified in the
`MissionControlController`.

### Customizing Basic Auth

It's recommended to use environment variables or Rails credentials for the
username and password instead of hardcoding them in your code.

I personally prefer using Rails credentials for this purpose. You can generate
the credentials file by running:

```sh
bin/rails credentials:edit
```

Then, add the following to your `config/credentials.yml.enc`:

```yml
mission_control:
  username: admin
  password: admin
```

And update your `MissionControlController` to use these credentials:

```rb
class MissionControlController < ApplicationController

  # When you deploy to production, the `assets:precompile` step will fail
  # without this check.
  # https://fly.io/docs/rails/getting-started/existing/#access-to-environment-variables-at-build-time
  if Rails.application.credentials.mission_control
    http_basic_authenticate_with(
      name: Rails.application.credentials.mission_control[:username],
      password: Rails.application.credentials.mission_control[:password]
    )
  end
end
```

## Conclusion

Adding Mission Control to your Rails app is a great way to monitor and manage
your background jobs. By securing it with Basic Auth, you can ensure that only
authorized users can access the Mission Control interface. Give it a try and
see how it can help you keep your app running smoothly!

For more information and advanced configurations, refer to the
[official documentation](https://github.com/rails/mission_control-jobs).
