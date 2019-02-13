Blocks in Ruby are always there
===============================

<time datetime="2013-08-09">Aug 9, 2013</time>

You probably know that even if your method doesn't accept blocks, you still can
pass them.

```ruby
def hello(hi)
  puts hi
end

hello('hi') { puts "I'm useless" }
#=> hi
```

What happens to that block? Well, even though you can't `block.call` the block
being passed, it is still accessible. For the sake of clearer demonstration I
use the [method_source](https://github.com/banister/method_source) gem.

```ruby
# The `Proc#source` method is powered by method_source.

$block = proc { puts "hi!" }

class Hello
  def hello
    binding
  end
end

bindval = Hello.new.hello(&$block) #=> #<Binding:0x007fa2b2953d58>
bindval.eval("Proc.new").source #=> "$block = proc { puts \"hi!\" }\n"
