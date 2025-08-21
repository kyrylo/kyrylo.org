---
layout: post
title: "Why do software developers love complexity?"
date: 2025-08-21
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

The Great Pyramids took decades to build. It was a monumental feat of human
ingenuity and collaboration. Today, we software developers erect our own
pyramids each day - not from stone, but from code. Yet despite far more advanced
tools, these systems don't always make the experience better. So why, when KISS
(Keep It Simple, Stupid) is a well-known mantra, do we keep gravitating toward
complexity?

## Marketing > Simplicity

Sell me this pen: ✎

What? You don't know how? Okay, instead, sell me this _Penzilla_ - a pen that
can erase, write in different colors, play music, dial 911, act as a radio
antenna, and even help you cheat on your homework.

In the software world, how would you sell a competitor to the `cat` command?
Sounds insane, right? It's so simple - why would anyone compete with it, let
alone build an alternative? (Let's pretend Rust coreutils don't exist.)

But what if instead of a `cat` competitor, it was _catzilla_ - a tool that could
watch your files, hop through portals, and jump across networks? Now that's
marketable! Still, nobody would take you seriously. Why? Because `cat` just
works, and it's highly unlikely anyone will ever need anything else (just like
Penzilla).

However, if `catzilla` were hyped from every corner of the internet, with a
CatConf coming next month, you'd at least be curious to try it. Social proof
makes you take it seriously. Even if it's just a gimmick, it's still a gimmick
with users.

Complexity also signals effort, expertise, and exclusivity. If you struggle to
understand it, your brain rewards you with awe: "Wow, this must be really
smart," you think - even if a simpler solution would work just as well.

Marketers, engineers, and startups all exploit this trick. The more layers, the
fancier the terminology, the more "premium" it feels. Complexity turns into a
status symbol rather than a necessity.

## What is inside the Great Pyramids?

Whatever you put inside, duh. Like the Pyramids, modern software is built layer
upon layer - dependencies, frameworks, and abstractions stacked high. But just
as the Pyramids' inner chambers are often empty, these layers can hide a lack of
substance, making maintenance a nightmare.

When you look at a Pyramid, only a moment later you notice your mouth is open
wide in awe (close it now). Simplicity, on the other hand, doesn't hold any
secrets inside. It's invisible until you realize it's genius.

Complexity shouts, "Look at me!", while simplicity whispers "Did you notice?".

One thing for sure, though, simplicity often wins in the long run. After the
initial amazement is gone, it's the function that quietly does the job that most
people need.

## React vs. vanilla JavaScript

This is a classic example I love to [rant about](https://justfuckingusehtml.com).

React piles concepts into your mental backpack: rendering models, hooks, state
libraries, routing, and a build pipeline. Say no to it, and suddenly you're the
"neckbeard stuck in the '90s," outside the cool-kids club.

The simple alternative is just around the corner: sprinkle vanilla JavaScript
where it's needed and don't build your identity around a framework. That mindset
is hard to swallow, though (especially when companies have spent millions
convincing developers their stack is the only way forward).

## Beyond marketing: why we embrace complexity

While marketing glorifies and normalizes complexity, several deeper, more innate
forces draw us developers toward it:

1. **The creative temptation:** We are problem-solvers by nature. Building a
   complex, intricate system is a rewarding intellectual challenge, akin to
   solving a magnificent puzzle. The temptation to over-engineer is a powerful
   siren song when we're flexing our creative muscles.

2. **Legacy systems and technical debt:** Many projects inherit convoluted
   codebases. Adding new features often means piling on more complexity rather
   than simplifying, as time and budget constraints prioritize quick fixes over
   elegant, simple solutions.

3. **Team dynamics and collaboration:** In large teams, developers add layers of
   abstraction to make code "future-proof" or accommodate diverse requirements.
   This can lead to over-engineered solutions as each contributor adds their own
   signature, creating a complex whole that no single person fully understands.

4. **Pressure to innovate:** In a competitive tech landscape, there's a constant
   pressure to differentiate. Novelty and innovation are often expressed through
   new features and intricate designs, making complexity an easy, if not always
   effective, way to stand out.

## Build pyramids with purpose

Build pyramids if you must, but build them like the Egyptians did: with a clear
purpose, a solid foundation, and chambers that actually contain something of
value - not just hollow, maze-like passages that future archaeologists (or the
poor soul maintaining your code in two years) will curse.

So next time you find yourself coding a 500-line abstraction for something that
could be copy-pasted a few times and done in 50 lines, ask yourself: are you
solving a real problem for the users and maintainers... or just indulging in
intellectual masturbation?
