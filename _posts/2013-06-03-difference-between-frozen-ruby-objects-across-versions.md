---
layout: post
title: "Difference between frozen Ruby objects across versions"
date: 2013-06-03 00:23:44 +0200
categories: programming ruby
redirect_from:
  - /2013/07/03/difference-between-frozen-ruby-objects-across-versions
---

Users of `Object#freeze` should know that the behaviour of this method has been
changing over the Ruby versions. Let's compare it.

#### Ruby 1.8.7p370

```ruby
nil.frozen? #=> false
nil.freeze
nil.frozen? #=> false

69.frozen? #=> false
69.freeze
69.frozen? #=> false

6.9.frozen? #=> false
6.9.freeze
6.9.frozen? #=> false

:snow.frozen? #=> false
:snow.freeze
:snow.frozen? #=> false
```

#### Ruby 1.9.3p392

```ruby
nil.frozen? #=> false
nil.freeze  #=> nil
nil.frozen? #=> true

69.frozen? #=> false
69.freeze
69.frozen? #=> true

6.9.frozen? #=> false
6.9.freeze
6.9.frozen? #=> false

:snow.frozen? #=> false
:snow.freeze
:snow.frozen? #=> true
```

#### Ruby 2.0.0p0

```ruby
nil.frozen? #=> false
nil.freeze  #=> nil
nil.frozen? #=> true

69.frozen?  #=> true
6.9.frozen? #=> true

:snow.frozen? #=> false
:snow.freeze
:snow.frozen? #=> true
```

#### Ruby 2.1.2p95

```ruby
nil.frozen? #=> false
nil.freeze  #=> nil
nil.frozen? #=> true

69.frozen?  #=> true
6.9.frozen? #=> true

:snow.frozen? #=> true
```

[@haileys](https://github.com/haileys) explains the difference.

> The difference between 1.9.3 and 2.0.0 is that on 64 bit platforms 2.0.0 uses
> flonums, which means Floats are immediate values just like nil, true, false,
> Fixnums, Symbols, etc.
