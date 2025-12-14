---
layout: post
title: "English is a poor language for programming with AI"
date: 2025-12-14
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

English and natural language in general is a bad interface for programming with
AI. Not because it is "imperfect". But because it was never designed for
precision.

Natural languages evolved for persuasion, storytelling, negotiation, and
survival in small tribes. They are optimized for social flexibility and rapid
communication, not exact meaning. That is why they keep failing us when we try
to use them as the primary interface for machines.

The language is full of hidden landmines: ambiguity, implied context, emotional
framing, and undefined terms. Humans constantly misinterpret each other (even
after thousands of years of practice).

The existence of lawyers is not an accident. It is evidence.

If natural language were precise, contracts would not need to be hundreds of
pages long. Courts would not exist to interpret intent. Disputes would not hinge
on what someone "meant".

Now we take this same fuzzy medium and say: "Hey AI, do exactly what I mean".

That is not engineering. That is wishful thinking.

## Examples of the problem

- _"Make it faster"._<br>
  Faster how? CPU? Latency? Cost? Perception?

- _"Use a lightweight solution"._<br>
  Lightweight in memory? Dependencies? Code size?

- _"Notify me when it is ready"._<br>
  Ready by whose definition?

Humans fill these gaps with intuition and shared context.<br>
Machines cannot reliably do that. And arguably should not be expected to.

## Real-world consequences

2025 research drives the point home. Veracode analyzed code from over 100 LLMs
and found that 45% of samples introduced OWASP Top 10 vulnerabilities (see
[2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report)).
A Cloud Security Alliance study
[reported](https://cloudsecurityalliance.org/blog/2025/07/09/understanding-security-risks-in-ai-generated-code)
that 62% of AI-generated code contains design flaws or known security
vulnerabilities (even with the latest models).

Prompts rarely specify security constraints, error handling, input validation,
or performance bounds. The model guesses. And often guesses wrong.

To be fair, natural language prompting has been a breakthrough. It has
democratized AI, enabling non-programmers to build complex applications quickly
and opened up rapid prototyping in ways that traditional coding never could.
Modern LLMs are remarkably good at resolving ambiguity using conversation
history, context, and probabilistic reasoning. Often better than early skeptics
predicted (see [research](https://arxiv.org/html/2411.12395v1)).

Yet these successes are still papering over a fundamental mismatch. Prompt
engineering helps, but it remains an imprecise art, not a science. When outputs
go wrong, we still end up blaming the model for "misunderstanding" us. Rather
than recognizing the root issue. We are asking it to read our minds in a
language built for nuance, not specification.

Jacque Fresco, futurist and founder of the Venus Project, repeatedly argued that
natural language is fundamentally inadequate for operating rational, technical
systems. In his lecture
["The Inadequacy of Language" (1975)](https://www.youtube.com/watch?v=ENFMAxol4-Y),
he emphasized that words are ambiguous, emotionally charged, and dependent on
personal interpretation. And that truly rational systems must rely on
measurable, objective, and instrument-based forms of communication rather than
symbolic abstraction.

Natural language is symbolic and expressive, not scientific.
It describes impressions and intentions, not verifiable constraints.

Words like "optimize", "secure", "simple", "important", and "critical" feel
meaningful. But they carry zero measurable content unless explicitly defined.

When we instruct AI in natural language, we are translating fuzziness into code
and hoping it collapses into correctness.

Sometimes it does.<br>
Often it does not.

The future is not just "better prompt engineering".<br>
It is better interfaces. Ones built on.

Explicit constraints instead of vague adjectives.
Measurable objectives instead of implied intentions.
Formal definitions instead of metaphors.

We are already seeing promising steps in this direction. Structured prompts
using JSON schemas or YAML, formal specification tools like
[TLA+](https://lamport.azurewebsites.net/tla/tla.html)
or
[Alloy](https://alloytools.org/),
visual programming environments, and agentic tools like Cursor or Replit Agent
that let users define goals with clearer boundaries and iterative feedback
loops.

## Conclusion

Natural language can and should remain a conversational layer.

A high-level UI.
A convenience for exploration and ideation.

But it should never be the source of truth for critical instructions.

You do not build a bridge using poetry.<br>
You do not govern machines using vibes.

And expecting AI to reliably interpret natural language as precise code
is like expecting a compiler to understand sarcasm.
