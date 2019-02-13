“Hello World” with recursive arrays in Ruby
===========================================

<time datetime="2014-05-18">May 18, 2014</time>

It doesn't mean anything. Just an interesting observation.

```ruby
a,@x=[],0;a<<[a,'world']<<'hello';def wtf(i);@x>10?return: (@x+=1;p i[0]; wtf(i[0]));end;wtf(a)

=begin
Output:
[[[...], "hello"], "world"]
[[[...], "world"], "hello"]
[[[...], "hello"], "world"]
[[[...], "world"], "hello"]
[[[...], "hello"], "world"]
[[[...], "world"], "hello"]
[[[...], "hello"], "world"]
[[[...], "world"], "hello"]
[[[...], "hello"], "world"]
[[[...], "world"], "hello"]
[[[...], "hello"], "world"]
=end
```
