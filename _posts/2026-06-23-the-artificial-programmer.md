---
layout: post
title: The artificial programmer
date: 2026-06-23
image: assets/images/kyrylo-silin@2x.webp
---

I recently got six months of free access to OpenAI's advanced coding models
because of my open-source contributions. I
[posted](https://x.com/kyrylo/status/2068857794955223259) about it on X. It's an
incredibly generous offer, and I've been using Codex every day since.

The convenience is ridiculous.

You describe what you want, and it produces working code. You paste a stack
trace, and it explains the bug and offers a fix. You ask it to add a feature,
and it updates the relevant files, writes tests, and sometimes even suggests the
migration. What used to take an hour of focused work can now take ten minutes of
prompting and reviewing.

This speed is genuinely useful. I am not going to pretend otherwise. But it also
makes it dangerously easy to stop doing the real work yourself.

The muscle that actually makes you a programmer is not typing code. It is the
ability to hold a mental model of a system, reason about trade-offs, spot the
smell in an abstraction before it spreads, and debug by thinking instead of
throwing prompts at the wall.

That muscle needs exercise.

With AI, many problems get solved before you ever have to think hard about them.
The friction disappears, and with it goes some of the growth. You still ship the
change, but you may not have learned much. You still get the green tests, but
you may not understand why the solution is shaped the way it is.

At the same time, the power on the other side is absurd. These tools are no
longer just autocomplete. They can act as agents: explore a codebase, make
coordinated changes across files, run commands, observe results, and iterate. It
is like having a tireless pair of hands that can execute at a speed no human can
match.

The leverage is real. Used well, it lets a single developer ship things that
previously required a small team.

The problem is the gap between those two realities. The tools reward you for
staying in the loop of prompting and accepting. They do not punish you for
slowly losing the ability to work without them. You can produce more output
while your underlying capability quietly erodes. You become very good at
directing an artificial programmer instead of remaining a real one yourself.

I have written before that
[AI amplifies programmers rather than replacing them](/software/2025/11/26/ai-amplifies-programmers-not-replaces-them.html).
I still believe that. But amplification only works if there is still something
strong on the receiving end. If the human side atrophies, you do not get 10×
output. You get 10× of whatever shallow thinking you brought to the prompt.

I also still believe that you should
[learn to code, ignore AI, then use AI to code even better](/software/2025/03/28/learn-to-code-ignore-ai-then-use-ai-to-code-even-better.html).
Maybe even more now.

The practical question is not whether to use these tools. You would be foolish
not to. The question is whether you are still doing enough deliberate, unaided
work to keep your own reasoning sharp.

Sometimes that means closing the AI tab and wrestling with the problem the old
way first. Sometimes it means using the model only after you have already formed
your own approach. Sometimes it means reading the generated code line by line
instead of accepting the diff because the tests passed.

The tools are too good to ignore, but they are also too good at letting you
coast.

The programmers who will matter in the next few years are not the ones who
prompt the best. They are the ones who stay sharp enough to know what to prompt
for, when to use the output, and when the output is wrong.

Everything else is just faster typing.
