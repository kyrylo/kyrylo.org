---
layout: post
title: Programming experience is no longer a moat
date: 2026-07-22
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

I have a Computer Science degree. I've been writing code for more than 15
years. I've written software in more than eight programming languages, read
countless programming books, and used to do code golf for fun.

Yet in 2026, it feels like I no longer have much of an advantage over someone
who only learned React.

I [posted this on X](https://x.com/kyrylo/status/2079585326482526389)
and asked a simple question: if AI has compressed years of accumulated
knowledge into something anyone can access, what should experienced programmers
focus on now? What becomes the new moat?

Some people read it as a confession rather than a question.

One person, who has been programming since the 1970s,
[replied](https://x.com/perrymetzger/status/2079714793120833922):
"Wow, what an admission."

Another [said](https://x.com/J_Von_Random/status/2079711656263684514)
that perhaps I had been a competent code-slinger but had never learned the
important architecture and engineering skills.

The implication was that if AI makes you question the value of your experience,
the only possible explanation is that you never had any. That may be a
comforting answer, but I don't think it is the correct one.

## Experience still matters

I have written before that
[AI amplifies programmers rather than replacing them](/software/2025/11/26/ai-amplifies-programmers-not-replaces-them.html).
I still believe that.

Give an incompetent programmer a powerful model and they may produce middling
crap. Give a competent programmer the same model and they can produce excellent
work faster than ever. One of the replies made exactly
[this point](https://x.com/J_Von_Random/status/2079725129597141486),
and I agree with it.

Experience helps you notice when generated code is subtly wrong. It helps you
ask better questions, reject bad abstractions, understand trade-offs, and know
when the green tests are lying to you. A beginner sees working code. An
experienced programmer sees the maintenance bill hiding behind it.

That is true, but it still wasn't the point I was making.

My point is that the distance between incompetence and competence has become
much shorter.

AI does not need to make a beginner equal to an expert to change the economics
of programming. It only needs to help the beginner catch up faster than before,
which is already happening.

## The ladder got shorter

When I started programming, knowledge was expensive.

You had to read the book, learn the vocabulary, fight with the compiler, search
through forum posts, misunderstand the documentation, break the program, and
then spend hours figuring out why. A lot of what we call experience is simply
the scar tissue left by repeating this process for years.

Today, a beginner can paste an error into an LLM and get an explanation in
seconds. They can ask for three possible solutions, request a comparison, and
then ask the model to implement the best one. They still need enough knowledge
to judge the result, but the amount they must learn before becoming productive
has collapsed.

The expert still starts further ahead, but the beginner no longer has to walk
the whole road to get somewhere useful.

That is what I mean by compression. AI has not deleted the difference between a
junior and a senior programmer. It has compressed it.

## The manual is no longer the bottleneck

The most interesting reply came from the programmer who disagreed with me. He
[said](https://x.com/perrymetzger/status/2079721096006316257) LLMs are
already excellent at systems programming. He routinely gets complicated
compiler tooling from them in one shot, and has had them nearly produce hardware
simulators from a manual in one shot too.

To me, however, this is evidence for my argument rather than against it.

The machine consumed the manual and produced the result. Now imagine that you
need to learn ten manuals. Would you spend months absorbing all of them before
starting, or would you use the machine sitting next to you? I know which option
I would choose.

He later [compared](https://x.com/perrymetzger/status/2079729662318584218)
programming by hand to learning arithmetic before using a calculator, solving
integrals before using Mathematica, and operating manual machine tools before
using CNC. I agree with that too. Learning the fundamentals gives you a mental
model that the tool cannot install with a single prompt.

Children should still learn arithmetic, of course, but doing long
multiplication by hand is no longer a moat.

Knowing assembly language can make you a better programmer, but it does not
mean you should manually translate every program into machine code. The
compiler moved that work into a tool, and AI is doing something similar one
level higher.

The knowledge still matters, but the market stops rewarding you merely for
having acquired it the hard way.

## Programming is becoming a commodity

This is the uncomfortable part of the discussion, because programming has been
such an important part of how many of us see ourselves.

Typing the same ten things by hand feels mundane when you know a machine can do
them faster. You already proved to yourself that you can write the code. Doing
it again is like reaching for a regular screwdriver when an electric one is
sitting next to it.

You can admire the craftsmanship of the regular screwdriver. You can practice
with it to keep your hands sharp. But don't confuse that practice with a
competitive advantage.

AI has made code cheaper because, as the models improve and absorb more public
code, documentation, books, and examples, more programming knowledge becomes
available on demand. As a result, the bottleneck moves away from remembering
how to produce the code.

Whether LLMs ["truly
think"](https://x.com/perrymetzger/status/2079724698452066645) is an
interesting philosophical argument, but it doesn't change the practical result.
If a machine can produce the compiler tooling, debug the system, and ship the
feature, the market will care about the result more than the internal mechanism
that produced it.

We will probably live through a turbulent period with mountains of bad
AI-generated software. Vibe coders will ship security holes, broken
abstractions, and dependency piles that nobody understands. The market will
slowly correct for it, though, because users still expect software to work.

Bad output from beginners does not preserve the old moat, though. It simply
shows that better tools have not eliminated the need for judgment.

## So what is the new moat?

I don't think the new moat will be syntax, framework trivia, or remembering an
API that the model can look up in a second. It will be everything around the
code: knowing which problem is worth solving, understanding the users and the
domain, and turning messy requirements into precise decisions.

It will also involve having enough taste to prefer a simple system over an
impressive mess, recognizing when the AI is confidently wrong, and being
willing to own the result after the prompt is finished.

Most of this was always part of good software engineering. The difference is
that it is becoming the job, rather than the layer of thinking around the job.

Experienced programmers should use AI aggressively. We should also keep our
fundamentals sharp, because without them we cannot judge what the machine gives
us. But we should stop treating the difficulty of our education as permanent
protection from newcomers, because it no longer provides that kind of
protection.

AI did not make my 15 years of experience worthless, but it did make a large
part of that experience easier for other people to borrow.

That experience still gives me an advantage, but it no longer feels like the
protective moat it once was. As code becomes cheaper to produce, the judgment
behind it becomes more important, and that is where I think experienced
programmers should focus.
