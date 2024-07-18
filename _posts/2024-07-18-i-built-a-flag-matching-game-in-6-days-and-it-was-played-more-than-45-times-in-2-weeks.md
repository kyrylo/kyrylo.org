---
layout: post
title: "I built a flag matching game in 6 days. It was played more than 45k times in 2 weeks"
date: 2024-07-18 12:00:00 +0200
categories: indie-hacking
image: https://imgur.com/32QTVqQ.jpg
---

<img src="https://imgur.com/32QTVqQ.jpg" style="margin-bottom: 1rem; width: 60%;" alt="Flag Match. There are 236 countries in the world. How many can you recognize?">
<br>
I built a flag matching game called [Flag Match](https://flagmatch.com) in 6
days that was played more than <b>45k times in 2 weeks</b>.

It's a simple game where you need to match the flag to the country name.
I launched it on [Product Hunt](https://www.producthunt.com/posts/flag-match)
and <b>it got 150+ upvotes</b>, ranking #6 on the day of the launch. The game also
became the <b>#1 product of the week</b> on Product Hunt in the Education category.

It was featured in the press by <a href="https://cenital.com/segun-coninagro-hay-12-economias-regionales-en-crisis/">Cenital</a> and <a href="https://www.justgeek.fr/flag-match-jeu-deviner-pays-drapeaux-127841/">JustGeek</a>. The game was also shared
on [Reddit](https://www.reddit.com/r/InternetIsBeautiful/comments/1e0k0vy/how_many_countries_can_you_recognize_by_their/), [Twitter](https://x.com/kyrylosilin/status/1809483713618522424), and [Hacker News](https://news.ycombinator.com/item?id=40881016#40890298). It received a lot of positive feedback and
encouragement from the community.

## What is Flag Match?

<img src="https://imgur.com/ss88S30.png" style="width: 50%" alt="Flag Match gameplay">

Flag Match is a simple game where you need to match the flag to the country
name. There are 236 countries and territories in the world, and you need to
recognize as many as you can. The game is designed to be played on mobile
devices with multi-touch support.

When you make a match, the matched pair disappears and you get a point. A new
pair appears, and you need to continue matching to beat the game. If you make a
mistake, the pair remains visible, and you lose your match streak. The game ends
when you match all the pairs.

There are continents that you can choose from, so you can focus on a specific
region. When you play, you can build up a match streak for each consecutive
correct answer. The game is timed, so you need to be quick to beat other
players. The game tracks your matches and mismatches to calculate your match
streak and match accuracy.

When you finish the game, you can share your score on social media and challenge
your friends to beat it. Your score may be shown on the leaderboard if you are
among the top 100 players.

The Flag Match website has a flags section where you can learn more about
[the flags of the world](https://flagmatch.com/flags-of-the-world). You can see
the flags of all countries and territories, and learn interesting facts about
them.

Flag Match is a fun and educational game that helps you to learn more about the
world. It’s a great way to test your knowledge and challenge yourself to get a
high score.

## Technologies used

The game is built with Ruby on Rails 7.1 and uses the SQLite database to store all
the information (countries, their flags, games, and scores). The front-end is
powered by Importmaps, Stimulus.js and Tailwind CSS. I deploy it to a VPS with
[Kamal](https://kamal-deploy.org).

This is my second project that uses SQLite as a production database. I
like it because it's simple to set up and use. It's also very fast and reliable.
For my needs, it proved to be a great choice. I don't need to scale the database
horizontally, so SQLite is a perfect fit for me.

I also use [Telebugs](https://telebugs.com) to monitor the game's errors. It's a
great tool that helps me to keep the game running smoothly. I get notified on
Telegram when something goes wrong, so I can fix it quickly. Actually, [I did
catch a nasty bug](https://x.com/kyrylosilin/status/1809970038872371614) that
way and fixed it before it caused any problems.

## Why I built it

Last year, I built a similar game called [Matcharoo](https://matcharoo.app) that
didn't get much traction. I wanted to try again and see if I could build
something that people would enjoy playing. I knew that it had the potential to
go viral, so I decided to try again.

In June, I saw the success of <a href="https://twitter.com/itseieio/status/1805986839058079896">One Million Checkboxes</a> and it gave me the motivation to build Flag Match. Although these games are very different,
somehow it game me the push I needed to start working on it.

## Technical challenges

### The original game mechanics was broken

I took the code from Matcharoo and adapted it to build Flag Match. I added new
features, improved the design, and fixed some bugs. I started with the exact
copy of the code and instead of matching English words, I changed it to match
flags to country names.

The game was simple to build, but I faced some challenges along the way. The
biggest challenge was to make the game fair for everyone. When people started
playing it, I noticed that some of them [abused the game by memorizing the order](https://www.youtube.com/watch?v=8St1-UFGNJg) of the flags that appear.

This revealed a problem with the original game mechanics. People who memorized
the order of the flags could match them very quickly and get a high score. This
was unfair to people who didn't know about this and had to rely on their memory.

It was a real head-scratcher for me. I didn't know how to fix it without
changing the game mechanics. At first, I implemented a detection mechanism that
punished players for doing this kind of run. However, it didn't work well and
people complained that they were being punished for playing the game normally.

After another day of thinking, I came up with a solution:

- I added a delay between the appearance of the flags. This way, people who
  relied on the order of the flags mechanics would be slowed down. If you know
  the flags, you can match them faster than the cheating players
- I randomized the order of the pairs that appear a little bit. This way, people
  who memorized the order would be thrown off

### Cheaters found a way to cheat

Someone hacked the game by using a script to show the pairs as numbers. Since
Flag Match is mostly written in JavaScript, it was easy to do. I changed some
things to make it harder to cheat like that, but since this is a client-side
game, it’s impossible to prevent all cheating. However, it’s absolutely possible
to make it harder to cheat.

Some people figured out that they could cheat by submitting fake scores to
the leaderboard. I added a few checks to prevent this from happening and it
seems to be working well.

## Reception

The game was well received by the community. People liked the game and shared it
with their friends. It was played more than 45k times in 2 weeks, which is
amazing. I got a lot of positive feedback and encouragement from the players.

I was especially happy to see that children enjoyed playing the game. It's great
to see that they are learning about the world and having fun at the same time.
I hope that the game will inspire them to learn more about the world and explore
new cultures.

This is my most successful project so far. I'm proud of what I've accomplished.
