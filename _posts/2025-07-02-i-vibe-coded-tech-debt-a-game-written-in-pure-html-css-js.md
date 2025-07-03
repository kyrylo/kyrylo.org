---
layout: post
title: "I vibe-coded Tech Debt: a game written in pure HTML/CSS/JS"
date: 2025-07-02
categories: projects
image: assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/01.png
---

![Tech Debt motd](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/01.png)

<a href="https://techdebtgame.com" target="_blank">Tech Debt</a> is a
keyboard-driven web game that teleports you back to the 90s. Your mission:
release a bug-free programming language in one day.

Your boss hired you to fix the mess left by the previous programmer before the
'95 WEBFEST conference. The conference starts _tomorrow_ morning, and you have a
full day (Sunday, unfortunately) to get it done.

## How to play

Mechanics are simple: when an error flashes on lane `A:`, hit <kbd>A</kbd>; if
it’s on lane `M:`, hit <kbd>M</kbd>, and so on. Every level teems with buggy
lines, so speed and accuracy are key.

Fix (aka shoot) a bug, and it counts as fixed. Shoot when there’s no bug, and
you’ve introduced one. Let a bug reach a label unfixed, and it’s counted as
slipped.

You want to be as accurate as possible, and not let bugs slip through. That
said, if you miss some, the game will still advance to the next level. It’s not
the end of the world, but it will impact your final score.

## How the game works

The game includes 13 levels, with a final boss on the last one. At each level,
your boss briefs you through a short narrative (sometimes hinting at what bugs to
expect).

![Tech Debt level 2 briefing](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/02.webp)

Bugs spawn randomly in waves. Some levels feature multiple massive waves —
special events that unleash an unusual number of bugs in a short amount of time.

Difficulty ramps up with each level: the early ones are slow-paced and easy,
while the later stages demand lightning-fast accuracy.

![Tech Debt level 2 gameplay](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/03.webp)

At the end of each level, you'll see statistics: bugs fixed, bugs slipped, and
new bugs introduced.

![Tech Debt level 2 stats](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/04.webp)

These stats contribute to your final assessment. After the last level, your boss
evaluates your programming language and decides whether to keep you on or fire
you.

## Why I built it

Don't get me wrong — I don't love errors. But I do love tools that help
programmers ship better software. My main product is a
<a href="https://telebugs.com">self-hosted error tracker</a>, and I wanted a fun
way to promote it.

A bug encyclopedia felt too boring. I’ve seen that before, and it didn’t gain
much traction. I wanted something original and engaging.

I love computer games and always wanted to make one, but a full-scale game
demands an insurmountable willpower and time — resources I couldn't spare for a
project with no revenue potential.

So instead, I chose to build a small, focused game that could be made quickly
yet still deliver value and fun. This way, I could combine my passion for games
with my goal of helping developers improve their software :P

## Inspiration and early prototype

The idea for Tech Debt came a few months ago. I spun up Grok and asked if
anything like it existed. When Grok said it hadn't, I knew I was onto something.

![Me asking Grok about the existence of my idea](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/05.webp)

Grok produced a rough demo (call it version 0.0.1) even though it was a bad
artifact, it proved the concept.

![Grok-coded Tech Debt](/assets/images/posts/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js/06.webp)

A month later, I began building the real game. I quickly realized I could borrow
some ideas from Plants vs Zombies (a timeless classic) because its lane
mechanics were very similar.

That’s where the idea for huge wave announcements came from (in Tech Debt,
they’re called testing phases).

## Why I vibe-coded it

I use AI-aided programming daily, but I’d never truly vibe-coded. To form a
clear opinion, I had to experience it firsthand. So I decided to vibe-code this
game entirely from scratch.

I love simplicity, and in the era of AI, I don’t understand our reliance on <a
href="https://justfuckingusehtml.com">bloated frameworks</a>. Tech Debt was was
coded entirely in pure HTML, CSS, and JavaScript. It just works (no build
process required) and I'm not limited by any frameworks or libraries.

## How I was doing it

I used [kamal-skiff](https://github.com/basecamp/kamal-skiff) to deploy it. This
is my go-to stack for building static sites.

For vibe coding, I mostly used Grok, with one or two ventures into Claude and a
few more into ChatGPT. VSCode is my editor of choice. I have Copilot installed,
but I didn’t use it at all for this project.

I didn’t use Cursor or Windsurf. They just haven’t dinged with me yet. For now,
I think I still prefer the old-fashioned (2022? lol) approach: talk to an LLM in
its own UI, then copy-paste the relevant bits.

## How did it go

To fast-forward: it was addictive, but not without caveats. My main problems
with vibe coding:

1. **I don't truly own the code.** Vibe coding can get you far, but the moment
   you commit those first AI‑generated changes, you’re on a journey into the
   unknown. The more code you add, the less you understand. Luckily, I’m fluent
   in raw JavaScript, so I could always drop into old‑fashioned code reading,
   but the incentive to do so is pretty low (AI makes you lazy).

2. **Refactoring is necessary.** AI doesn’t produce perfect code (and neither do
   I). With the right prompts you can massage it into shape, but once my
   codebase grew, I had to ask for a refactor. What started as procedural
   spaghetti got a lot more readable (and yes, I split things into multiple files
   by hand, since the AI never suggested it).

3. **AI is slow at printing.** I leaned heavily on Grok’s “Think” mode, which
   isn’t the speediest. Asking it to dump an entire file (over 1,000 lines!) so
   I could copy‑paste in one go meant a single change sometimes took 5–7 minutes
   of waiting.

4. **Copying small bits of code can be challenging.** When an LLM suggests a
   snippet, finding exactly where it belongs can be a pain. That’s why I kept
   asking for full‑file prints. _While I was writing this, I realized what I
   really needed was a git diff I could apply automatically._

5. **AI is terrible at programmatic music.** I asked it to compose a soundtrack
   in Tone.js. Instead of music, I got… well, farts. So I ended up doing the
   audio by hand.

6. **Removing and adding comments all the time is annoying.** LLMs love to
   sprinkle in random comments, and then strip them back out on the next pass.
   Nuff said.

7. **AI is dumb.** “Thinking” in LLMs doesn’t exist yet. It can only remix what
   it’s seen before, it won’t invent the core idea for your game. Sure, it can
   write code, but you still need to know what you actually want to build.

### The upside

However, vibe coding, as demonstrated by my project, is real. It's not a
gimmick, and you should fear for your job. AI is dumb, but in smart hands, it's
a dangerous weapon. You can really do things with it. So my recommendation is to
try and get your feet wet to see what you're missing. It can't solve all the
problems, but it can automate mundane tasks reasonably well.

## Conclusion

I’m really happy with how the game turned out. In my opinion, it came out
brilliantly well. There are a few rough edges, but they don’t affect the
gameplay, and honestly, I don’t care enough to fix them.

Now go and <a href="https://techdebtgame.com">pay your tech debt</a>!

P.S. The game has an easter egg.
