---
layout: post
title: AI will not stop at simple work
date: 2026-07-23 19:17:27 +0800
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

After I wrote that [programming experience is no longer a
moat](/software/2026/07/22/programming-experience-is-no-longer-a-moat.html),
one reply kept appearing.

AI can write simple code, people said, but when the system becomes complicated,
you still need an experienced human.

This is a reasonable objection.

It also feels true today.

Ask a model to build a small application and it moves quickly. Ask it to change
billing rules across a ten-year-old system and it may wander into the woods. A
human has to pull it back.

The mistake is treating that boundary as permanent.

The models that struggled with a complete feature last year can now explore a
codebase, change several files, run tests, notice failures, and try again. They
still get lost, but the forest keeps getting larger.

The replies focused on where the boundary is today. I was more interested in
where it is moving.

A complicated system is not complicated in one giant way. It is usually a pile
of smaller decisions held together by constraints.

The payment must be retried, but never twice at the same time. Old customers
keep their original price. The migration must work without downtime. Failed
jobs must be safe to run again. This strange database column cannot be removed
because a forgotten report still uses it.

An experienced programmer carries much of this context in their head.

The model does not.

Give it a vague request and it fills the gaps with guesses. Give it the intended
behaviour, the constraints, the edge cases, the relevant code, and a way to test
the result, and something different happens.

It breaks the work down. It proposes a plan. It changes the code, runs the
tests, reads the failures, and adjusts.

It will still make mistakes. Sometimes serious ones. I am not claiming that AI
can already redesign every complicated system perfectly.

I am saying that it is moving into complicated work faster than many
programmers are updating their idea of what complicated means.

That shifts the bottleneck.

The difficult part becomes less about whether the machine can produce the code.
It becomes whether the human can explain what correct means.

That is not a small task.

Writing a good specification requires understanding the system, finding the
hidden constraints, resolving contradictions, and choosing trade-offs. Then
someone still has to review the result and take responsibility for it.

The human remains, but the work changes.

More of it becomes specification, judgment, verification, and ownership.

If you cannot describe the constraints, the model will invent them for you. If
you can, you still have to check the result and put your name on it.

That is the part experienced programmers should be practising now.
