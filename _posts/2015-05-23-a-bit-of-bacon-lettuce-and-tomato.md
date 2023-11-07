---
layout: post
title: "A bit of bacon, lettuce and tomato"
date: 2015-05-23 00:23:44 +0200
categories: programming ruby
---

While browsing the source code of the Ruby's virtual machine I stumbled upon an
[easter egg][1].

If you recompile your Ruby with the `SUPPORT_JOKE` setting, you'll be able to
call two hardcoded methods called `#bitblt` and
`the_answer_to_life_the_universe_and_everything`.

```ruby
[1] pry(main)> bitblt
=> "a bit of bacon, lettuce and tomato"
[2] pry(main)> the_answer_to_life_the_universe_and_everything
=> 42
```

The return values are defined in [`insns.def`][2].

[1]: https://github.com/ruby/ruby/blob/7ceb9ecc31238523911b8d1c66b47a990132c0b2/compile.c#L4528
[2]: https://github.com/ruby/ruby/blob/7ceb9ecc31238523911b8d1c66b47a990132c0b2/insns.def#L2231-L2257
