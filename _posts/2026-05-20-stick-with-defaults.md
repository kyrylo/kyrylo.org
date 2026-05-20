---
layout: post
title: Stick with defaults
date: 2026-05-20
image: assets/images/kyrylo-silin@2x.webp
---

There is a strange instinct among developers to distrust defaults. The moment we
install a new tool, framework, editor, or operating system, many of us
immediately begin searching for “the real setup”. We hunt for configuration
guides, optimization tricks, must-have plugins, and dotfiles maintained by
people with anime avatars and 700-line configuration files.

Somewhere along the way, software customization became a hobby of its own. This
reflects the same pattern behind [why developers love
complexity](/software/2025/08/21/why-do-software-developers-love-complexity.html).

But the longer I write software, the more I appreciate defaults.

The default path is where every user begins. It is the most exercised, most
documented, and most battle-tested part of the product. Thousands or millions of
people have already walked that road before you. Bugs are discovered there
first. Edge cases are encountered there first. Performance issues become visible
there first. When something breaks, the maintainers notice because everyone is
using it.

Defaults are not arbitrary. They are usually the result of years of accumulated
experience and hard-won trade-offs between performance, maintainability,
usability, and predictability. When Rails ships with a certain project
structure, or SQLite enables certain behaviors by default, or a browser decides
how something should work out of the box, there is often more practical
reasoning behind those choices than most developers assume.

The customized path, by contrast, is lonely.

The more you diverge from the defaults, the more you become responsible for your
own ecosystem. Documentation becomes less relevant because your environment no
longer matches what everyone else is using. Tutorials stop applying cleanly.
Upgrades become riskier. You start carrying a collection of tweaks whose
original purpose you no longer remember.

**I know this because I used to do exactly that.** I spent countless hours
configuring editors, terminals, Linux desktops, tiling window managers, browser
setups, and JavaScript toolchains in pursuit of some ideal workflow that never
actually arrived. At some point, the setup itself quietly became the project. I
was investing more energy into perfecting the environment than using it to build
things.

Meanwhile, the person using the defaults quietly ships their work.

This is not an argument against customization entirely. Sometimes defaults
genuinely do not fit your needs. Some workloads require tuning. Some preferences
matter. But customization should come from real friction encountered over time,
not from the assumption that the default experience must be inferior simply
because it is common.

There is also a psychological trap here. Developers often associate
customization with expertise. Using the default setup can feel unsophisticated,
as if you are leaving performance or productivity on the table. But many
experienced engineers eventually arrive at the opposite conclusion: simplicity
has value, and every deviation from the standard path carries a maintenance
cost.

A good default reduces cognitive load. It lets you focus on the actual work
instead of endlessly shaping the environment around the work.

This becomes more obvious as software matures. Modern tools are significantly
better than they used to be. Browsers work well without extensions. Rails
defaults are remarkably solid. SQLite handles workloads that people once
considered impossible for it. Even operating systems have become harder to
misconfigure catastrophically.

The industry has slowly learned that good defaults are a feature.

In many cases, the default path is not merely the easiest option. It is the
option refined through the largest amount of real-world usage. That matters.
Software behaves differently under millions of users than it does in theory.

So these days, I try to resist the instinct to immediately optimize and
customize everything. I start with the defaults and stay there until something
repeatedly becomes a real problem. Most of the time, that moment never comes.

And when it does, I at least understand exactly why I am changing something.
