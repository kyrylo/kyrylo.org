---
layout: post
title: There's no place for Test-Driven Development (TDD)
date: 2024-10-30
categories: software
image: https://imgur.com/5AaV4pW.png
---

<img src="https://imgur.com/5AaV4pW.png" style="margin-bottom: 1rem; width: 75%;" alt="A Jenga tower with some blocks labeled 'Tests' being pulled out">
<br>
Test-Driven Development (TDD) _doesn’t make sense_ to me, especially when
requirements change frequently.

In TDD, the idea is to write tests before the actual code, allowing for a cycle
of development where the tests guide implementation. But when requirements are
always shifting, _I never find a point in the development cycle where TDD feels
useful_.

When I develop a feature, I usually follow these steps:

1. **Make it work**: a mandatory, crappy implementation that gets the job done.
2. **Make it right**: a nice-to-have step, improving code maintainability and reusability.
3. **Make it fast**: by this point, I’m already moving on to the next class or method, driven by the need for speed.

When it’s time to re-assess my work, that’s when I optimize for speed and write
tests.

At each of these stages, TDD creates **friction**. And I don’t like friction.
While tests add a valuable layer of assurance, they can also slow you down. The
smoother the workflow, the happier we are.

In theory, you should write tests that don't depend on your implementation,
allowing you to write the test once and change your implementation as needed.

_That’s supposed to reduce friction, right?_

However, in my practice, this is challenging. You end up thinking about
abstractions instead of being productive and pushing out more customer-facing
code. Instead of focusing on delivering features, I find myself entangled in a
web of test cases and mock objects.

_So, this leads to more friction instead._

I've tried TDD and have tested my code religiously before. Yet, I discovered
that I spent more time in the `_test` or `_spec` files than in the files that
actually implement a feature. It feels like running a marathon, only to find
you’ve been looping around the same track.

What many TDD proponents overlook is that tests can contribute to technical debt
as well. The more tests you write, the more code you need to maintain.

If you feel compelled to write a test every time you change a line, you could
end up managing an Everest of tests - mountains of code that require as much
care and attention as the features themselves.

Ultimately, while TDD might work in stable environments, I prefer a more
flexible approach to keep my workflow agile and responsive.
