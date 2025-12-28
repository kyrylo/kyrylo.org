Various ways to count digits in a Ruby integer
==============================================

<p class="post__date"><time datetime="2013-08-13">Aug 13, 2013</time></p>

The most obvious solution is to convert it to string and count characters.
Boring.

```ruby
num = 6969

# Meh.
num.to_s.length #=> 4
```

Imagine Ruby is C now and has no strings. What you gonna do?

```ruby
num = 6969
len = 0

# Hm...
begin
  len += 1
end while (num /= 10) > 0

p len #=> 4
```

It turns out math can be useful. There's another way to solve the problem. It
has a flaw, though: it doesn't support negative integers.

```ruby
num = 6969

# Wow.
Math.log10(num).floor.succ #=> 4

num = -6969

# Ouch.
Math.log10(num).floor.succ #=> Math::DomainError: Numerical argument is out of domain - "log10"
```

It doesn't? Well-well, my teacher said that math can deal with everything.

```ruby
num = -6969

# Cool.
Math.log10(num.abs).floor.succ #=> 4

num = 0

# Oh!
Math.log10(num.abs).floor.succ #=> FloatDomainError: -Infinity
```

With everything? Mhm, with help of Ruby.

```ruby
num = 0

# Mhm.
Math.log10(num.zero? && 1 || num.abs).floor.succ #=> 1
```
