---
layout: post
title: "How to run your Turbo Native Android app on a physical device locally"
date: 2024-01-08 00:23:44 +0200
categories: turbo-native android
image: https://imgur.com/zuNW2bk.png
---

<img src="https://imgur.com/zuNW2bk.png">
While working on the Android app for [Synonym Sprint][synonym-sprint] using
[turbo-android][turbo-android], I hit a problem. My app would load in the
Android Studio emulator just fine, but when I connected my Android phone via USB,
the WebView wouldn't load my web page.

<img src="https://imgur.com/pQHoN24.png">

Here's what I did.

I enabled the logging for Turbo Android. You can do it in your `MainActivity`
like this:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    Turbo.config.debugLoggingEnabled = true
}
```

Then I inspected the logs via Logcat and found the following output:

```
TurboLog . onPageStarted   [session: tab_play, location: http://10.0.2.2:3000/play]
TurboLog . onReceivedError [session: tab_play, errorCode: -8]
```

I had no clue what `-8` meant, so I connected to my app via Chrome's remote
browser (`chrome://inspect`). Then I found my remote target and clicked on the
`inspect` link:

<img src="https://imgur.com/nvQ4vLG.png">

Then I found the description of the error in the HTML document.

The error turned out to be `net::ERR_CONNECTION_TIMED_OUT`:

<img src="https://imgur.com/65QSLQr.png">

I immediately knew that the standard IP for accessing your local web server
through the emulator, `10.0.2.2`, was not accessible.

The solution is to change the `startLocation` of your
`SessionNavHostFragment` from `http://10.0.2.2:3000` to your local network
address.

On macOS, you can find the address via `ipconfig getifaddr en1` or `ipconfig
getifaddr en0`. Then use the address as your start location.

```kotlin
class SessionNavHostFragment : TurboSessionNavHostFragment() {
    override var startLocation = "http://192.168.0.3:3000"
}
```

You need to change your `network_security_config.xml` to allow the new domain.

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config xmlns:android="http://schemas.android.com/apk/res/android">
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.0.3</domain>
    </domain-config>
</network-security-config>
```

You also need to bind your Rails server to that address:

```sh
bin/rails server -p 3000 -b 192.168.0.3
```

Rebuild your app for your physical device, and voilà! Everything should work now.

You can discuss this article on X/Twitter:
<br>
[https://twitter.com/kyrylosilin/status/1744384157390606396][twitter]

[synonym-sprint]: https://synonymsprint.com
[turbo-android]: https://github.com/hotwired/turbo-android
[twitter]: https://twitter.com/kyrylosilin/status/1744384157390606396
