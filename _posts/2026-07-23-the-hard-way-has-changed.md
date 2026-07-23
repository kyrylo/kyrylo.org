---
layout: post
title: The hard way has changed
date: 2026-07-23
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

After I wrote that [programming experience is no longer a
moat](/software/2026/07/22/programming-experience-is-no-longer-a-moat.html),
many people told me that experience was still the real moat.

LLMs can produce code, they said, but they cannot compress judgment. You only
get that by spending years debugging systems, making mistakes, and suffering
with the compiler.

I think they are right about the first part.

I am less sure about the second.

## We don't know yet

The technology is too new.

Nobody has spent ten years learning programming with a capable coding agent
because capable coding agents haven't existed for ten years. We cannot examine
the careers of people who learned entirely this way. Those careers have barely
started.

Maybe some beginners have already compressed five years of learning into two.
Maybe they only look competent because the machine is doing the work. A working
application doesn't tell us which one happened.

One [small study of novice
programmers](https://doi.org/10.1145/3632620.3671116) found exactly this split.
Almost everyone completed the task, but some students used AI to move faster
while others became even more confused.

It is interesting, but it doesn't answer the bigger question. Only time will.

## Two kinds of beginner

The first beginner asks the LLM to build an application.

It works. They ask for another feature. That works too. When something breaks,
they paste the error back into the chat and apply the next patch.

After six months, they may have shipped a surprising amount of software. They
may also understand very little of it.

I know how addictive this is because [I tried vibe-coding an entire
game](/projects/2025/07/02/i-vibe-coded-tech-debt-a-game-written-in-pure-html-css-js.html).
The incentive to stop and read the code is almost nonexistent when the next
prompt can keep you moving.

The second beginner does not start by reviewing architecture and rejecting bad
abstractions. They cannot. They are still a beginner.

They start smaller.

They ask what each file does. They try to predict what the code will do before
running it. They ask for a hint before asking for the patch. After the LLM fixes
a bug, they revert the fix and try to reproduce it themselves.

They break their small application on purpose. They change the input, delete a
record, add latency, or make an API return nonsense. Then they watch what
happens.

At first, they will ask bad questions and misunderstand the answers. That is
normal. The important part is that they stay with the problem after the code
starts working.

Eventually, they can read the generated architecture. Eventually, they can
compare two approaches and notice that one of them is a mess. Eventually, they
can refuse the first working answer.

Those are not skills the beginner starts with. They are what this process is
supposed to produce.

## Friction still matters

I previously wrote that beginners should [learn to code, ignore AI, then use AI
to code even
better](/software/2025/03/28/learn-to-code-ignore-ai-then-use-ai-to-code-even-better.html).

I am no longer sure about the "ignore AI" part.

A beginner may be able to use AI from the first day and still learn properly.
They just cannot let it remove every obstacle.

The LLM can finish the exercise, or it can help you understand the exercise.
Those uses look similar from the outside because both may produce working code.

Only one of them requires much thinking.

The old route included friction automatically. The compiler refused to
cooperate. Documentation was unclear. Answers were difficult to find. You had no
choice but to sit with the problem.

Now the easy answer is always one prompt away.

That means the beginner has to choose the hard part deliberately.

Build something small enough to understand. Read what the model writes. Ask for
explanations, not only fixes. Work without it occasionally. Break things in a
safe environment. Put something real online and take responsibility when it
fails.

Experienced programmers should not pretend that our old learning route is the
only route that can produce judgment. Beginners should not pretend that shipping
AI-generated software means they have already developed it.

If I were learning today, I would use AI from the beginning. But if the code
worked and I couldn't explain why, I would not consider the lesson finished.
