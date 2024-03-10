---
layout: post
title: "Pulling through a Ruby exception"
date: 2013-07-03 00:23:44 +0200
categories: programming ruby
redirect_from:
  - /2013/07/03/pulling-through-a-ruby-exception
---

Pry and IRB both have an interesting property. In these consoles, there's a
possibility to correctly define a method or a class and get an exception. All in
the one go. I'll be using Pry for the demonstration.

Let's define and use a method.

```
[1] pry(main)> HELLO!!!
             | def foo
             |   :HI!
             | end
NoMethodError: undefined method `HELLO!' for main:Object
from (pry):4:in `__pry__'
[2] pry(main)> foo
=> :"HI!"
```

It works! But what about blocks?

It doesn't work.

```
[2] pry(main)> HELLO!!!
             | [1, 2, 3].map { |n|
             |   n + 100
             | }
NoMethodError: undefined method `HELLO!' for main:Object
from (pry):6:in `__pry__'
```

Now it makes more sense, right? Tell me what sense to you makes this snippet.

```
[3] pry(main)> HELLO!!!
             | [1, 2, 3].map { |n|
             |   HI!!!
             |   n += 100
             | }
NoMethodError: undefined method `HI!' for main:Object
from (pry):14:in `block in __pry__'
```

Suddenly, the exception being raised is about the absense of the `HI!` method,
not of the `HELLO!` one. Finally, the most outstanding example. Let's define
some crazy classes.

```
[1] pry(main)> CLASSY!!!
             | class A
             |   AWESOME!!!
             |   class B
             |     MARVELOUS!!!
             |     def great
             |       'awful :-('
             |     end
             |   end
             | end
NoMethodError: undefined method `MARVELOUS!' for A::B:Class
from (pry):7:in `<class:B>'
[2] pry(main)> A
=> A
[3] pry(main)> A::B
=> A::B
[4] pry(main)> A::B.new.great
=> "awful :-("
```

A few things to note. Firstly, the raised exception knows about the existence of
the `A` and `B` classes. Secondly, we've just defined a normal class that
we can instantiate.
