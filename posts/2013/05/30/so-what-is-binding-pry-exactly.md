So what is “binding.pry” exactly?
=================================

<p class="post__date"><time datetime="2013-05-30">May 30, 2013</time></p>

<p class="center"><img src="https://imgur.com/uxHPVG0.gif"/></p>

Yui-knk has translated this article into [Japanese][japanese].

The very first feature that you learn about Pry is undoubtedly
“binding.pry”. You put it here, there and everywhere; you’re happier than you’ve
ever been before. In simple words: “binding.pry” makes your life a lot
easier. But, have you ever wondered what “binding.pry” is? It appears so simple
that you don’t even think of the details. When I first started to use Pry, I
simply cargo-culted it. “binding.pry” seemed to me like some mysterious
sorcery. Obviously, that’s not true, but when you learn something new things
always appear more mysterious than they really are. By the end of this article
you should have a solid understanding of one of the oldest and most interesting
features of Pry.

The story of a little expression with incredible power
------------------------------------------------------

<div class="figure">
<img src="https://imgur.com/WRNWYXI.gif"/>
<div class="caption">Ground control to Major Tom...</div>
</div>

We can use “binding.pry” almost anywhere. For instance, when you launch Pry via
the command-line interface its default context is always “main”[^1]. Pry
displays this information in the prompt (<nobr>“\[1\] pry(main)>”</nobr>). The
prompt is dynamic: it always displays the current context.

The following snippets demonstrate a number possible places you can insert a
“binding.pry”. The only difference is the context.

```
class Song
  # Pry session starts in the context of Song.
  binding.pry # pry(Song)

  def play
    puts 'Ground control to Major Tom...'
  end
end
```

```ruby
class Song
  def play
    # The context is an instance of Song.
    binding.pry # pry(#<Song>)
    puts 'Ground control to Major Tom...'
  end
end
```
```ruby
class Song
  def play
    puts 'Ground control to Major Tom...'
  end
end

# The context is main.
binding.pry # pry(main)
```


“binding.pry” divided into “binding” and “pry”
----------------------------------------------

It’s time to slightly lift the veil. I’m sure a few of you know about the
Binding class from Ruby; but I’m also sure an even larger number have never
heard of it. It’s not really a feature that every Ruby programmer needs to be
familiar with — but this is exactly what powers “binding.pry”. Let’s analyse
this further below.

### “binding”

“binding” is a method. It always returns a new instance of the Binding class.

    binding.class #=> Binding
    binding #=> #<Binding:0xa9dcefc>
    binding #=> #<Binding:0xa9ee490>


You can invoke it anywhere you want, because it is a method of the Kernel module
and Kernel methods are available on every object. One more important thing to
know is that the Binding class can’t be instantiated directly[^2]. The “binding”
method is the only interface.

So what exactly is a “binding”? A binding is a like a “snapshot” of everything
available at the moment of instantiation: current value of “self”, local
variables, methods, instance variables and more.  Think of it as a room in the
house full of items. There can be many rooms. Each room has its own set of items
and a window. In Pry internals such a place is called a context. But foremost,
in order to get an item from a room, we need to pry open a window and creep into
a house, so we can see what’s available around.

Thanks to the Binding class, the so-called window can be implemented with a
single method call. Let’s call it “Room#window” and put a teddy bear in it. Our
aim is to take out that bear.

```ruby
class Room
  def initialize
    @items = [:teddy_bear]
  end

  def window
    binding
  end
end

backpack = []
bedroom = Room.new

bedroom.window.eval('@items') #=> [:teddy_bear]
backpack << bedroom.window.eval('@items.pop')
backpack.inspect #=> [:teddy_bear]
bedroom.window.eval('@items') #=> []
```

You can also ask Maria to take back the teddy bear. Thanks to “binding” we are
able to evaluate Room’s code in the context of Maria, so no-one will cry later.

```ruby
module Maria
  def self.take_back(item, from, to)
    eval("@items << #{ from.delete(item).inspect }", to)
  end
end

Maria.take_back(:teddy_bear, backpack, bedroom.window)
backpack.inspect #=> []
bedroom.window.eval('@items') #=> [:teddy_bear]
```

### “pry”

<div class="figure">
<img src="https://imgur.com/RMzmI9o.gif"/>
</div>

Onwards to the other part of “binding.pry” expression, “pry”. It turns out that
you can invoke “pry” almost on every Ruby object. That's possible because it is
defined on Object, the ancestor of every Ruby class. The method being invoked on
a random object, starts a new Pry session in the context of that object.

```haskell
[1] pry(main)> ['andrew', 'alexander', 'vladimir'].pry
[1] pry(#<Array>)> map &:capitalize
=> ["Andrew", "Alexander", "Vladimir"]
[2] pry(#<Array>)> exit
=> nil
[2] pry(main)> "do you hear me?".pry
[1] pry("do you hear me?")> upcase
=> "DO YOU HEAR ME?"
[2] pry("do you hear me?")> exit
=> nil
[3] pry(main)>
```

Remembering the examples in the beginning of this article and looking at the
snippet above might put an idea into your head: we can get rid of constant
typing of “binding” and just write “pry” instead, can't we? It turns out, we
can. However, “binding.pry” and “pry” are not interchangeable. They start Pry
sessions in different contexts.

The following example uses “binding.pry”. A Pry session is started in the
context of a Song instance and the “music” local variable is accessible.

```ruby
class Song
  def play
    music = 'rock & roll'
    "I love #{ binding.pry }"
  end
end

Song.new.play
```

```haskell
[1] pry(#<Song>)> music
=> "rock & roll"
```

Let’s slighlty modify the “Song#play” method and use “pry” this time. Again, the
session starts in the context of the Song instance, but things work a bit
different, now. In this case the “music” local variable is not
accessible. Although we invoke “pry” in the scope of “Song#play” method, the Pry
read-eval-print-loop starts not where you might expect. The local variable is
unreachable, because Pry does not operate on the binding of the “Song#play”
method. Instead, it operates directly on the instance, implicitly accessible via
“self”.

```
class Song
  def play
    music = 'rock & roll'
    "I love #{ pry }"
  end
end

song = Song.new #=> #<Song:0x9d89588>
$old_id = song.object_id #=> 82594500
song.play
```


```haskell
[1] pry(#<Song>)> music
NameError: undefined local variable or method `music' for #<Song:0xbd2fe00>
from (pry):7:in `__pry__'
[2] pry(#<Song>)> whereami
Inside #<Song>.
[3] pry(#<Song>)> object_id == $old_id
=> true
```

The “self” keyword has also acquired its “pry” method from Object (not
literally, since it’s just a placeholder for other Ruby objects that have that
method defined). So “self.pry” and “pry” are totally equal.

There is one minor case when you can’t invoke “#pry”, though. Unfortunately, Pry
doesn’t support instances of BasicObject, so you can’t pry into them. The reason
is that BasicObject is the superclass of Object, and it sits even higher in the
ancestry chain. It means that its instances don’t have the “pry” method. We
can’t just move “Object#pry” to “BasicObject#pry”, because BasicObject instances don’t
have the “binding” method, on which “Object#pry” relies.

```ruby
basic = BasicObject.new #=> #<BasicObject:0x512c30c>
basic.pry #=> NoMethodError: undefined method `pry' for #<BasicObject:0xa258618>
```

Remember, you get “binding” from the Kernel module and Object is the only class,
which includes it. This is by Ruby’s
design. [Some people want to see the binding support for BasicObject][ruby-bug-5360],
but this is unlikely to happen in the near future. In Pry lobby interviews
[there were attempts to work around this][pry-bug-516], but they didn’t go too
far.

Although Pry can’t support BasicObject instances, it supports BasicObject class
itself, because Class instances do have bindings.

```haskell
[1] pry(main)> BasicObject.pry
[1] pry(BasicObject)> __id__
=> 81839890
```

Another interesting feature of the “pry” method is that it supports
arguments. So `pry`, `self.pry` and `pry(self)` are the exact same
expressions. In fact, it accepts any Ruby objects, not only “self”. Just
imagine, it’s only a one method, but how much power it is endowed with!

In the example below you can clearly see that “pry” is not like the “cd”
command. It doesn’t store a chain of bindings (known as a binding
stack). Instead, it always creates a new session, with its own binding stack
(look at the “\[1\]” from the prompt, it doesn’t continue the previous counter,
but starts a new one, without modifying the existing counter).

```haskell
[1] pry(main)> pry 1337
[1] pry(1337)> pry ''
[1] pry("")> pry :awesome!
[1] pry(:awesome!)>
[1] pry(:awesome!)> nesting
Nesting status:
--
0. :awesome! (Pry top level)
[2] pry(:awesome!)> exit
=> nil
[1] pry("")> nesting
Nesting status:
--
0. "" (Pry top level)
```

The “pry” method also accepts the second argument: a hash of options. Most of
the time you don’t need it. However, it won’t hurt you to know slightly more
than an average Pry user, because you’re the special one. You can check the full
list of options in the “[pry_instance.rb][pry-instance]” file (as of Pry
v0.9.12.2). That list is quite big, so let me show you some of the insteresting
options: “:output” and “:extra_sticky_locals”.

In the next example I did a couple of things. Firstly, I redirected all the
output from a nested Pry session to a local variable called “output_history” and
then printed its contents. Secondly, I injected a new sticky local
variable. Sticky variables are shared across all Pry sessions and they’re
accessible in any context. Just bear in mind that since the “pry” method creates
a new Pry session, the hash options don’t affect the parent session: they’re
valid only for the new session.

```haskell
[1] pry(main)> output_history = StringIO.new
=> #<StringIO:0xab8978c>
[2] pry(main)> :universe.pry :output => output_history, :extra_sticky_locals => { :time => Time.now }
[1] pry(:universe)> whereami
[2] pry(:universe)> ls
[3] pry(:universe)> time
[4] pry(:universe)> Help me out!
[5] pry(:universe)> exit
=> nil
[3] pry(main)> puts output_history.string
Inside :universe.
Comparable#methods: <  <=  >  >=  between?
Symbol#methods:
  <=>  =~       capitalize  empty?    inspect  match               size   swapcase  to_sym
  ==   []       casecmp     encoding  intern   next                slice  to_proc   upcase
  ===  __pry__  downcase    id2name   length   pretty_print_cycle  succ   to_s
locals: _  __  _dir_  _ex_  _file_  _in_  _out_  _pry_  time
=> 2013-05-25 14:22:34 +0300
NoMethodError: undefined method `out!' for :universe:Symbol
from (pry):3:in `__pry__'
=> nil
[4] pry(main)> time
NameError: undefined local variable or method `time' for main:Object
from (pry):8:in `__pry__'
```

“binding” and “pry” pulled together
-----------------------------------

<div class="figure">
<img src="https://imgur.com/RnLRxrb.gif"/>
</div>

So now, since you know a lot more about bindings and prys, it’s time to answer
the main question. How does the Pry REPL know where to start a
read-eval-print-loop? Why does “binding.pry” work? In simple words, when you
invoke “pry” on an object, Pry gets the binding of that object and starts a REPL
in its context. The mechanism for retrieving a binding is simple and robust. Its
name is “Pry.binding_for”.

```ruby
b = Pry.binding_for(:universe) #=> #<Binding:0xb2e7ad8>
b.eval('self') #=> :universe
```

You can pass any Ruby object to it. If you pass a Binding instance or a
top-level binding, it returns it. But with other parameters it works a little
bit different. It calls `__binding__` method on “:universe” and it returns the
corresponding binding. The question is where does “:universe” obtain this
method? It is defined on Object, too.

Another supplementary method is used for retrieving a binding. Whenever you call
“pry” on something, Pry internally creates a new method on that object called
`__pry__`.


```haskell
[1] pry(main)> :universe.__pry__
NoMethodError: undefined method `__pry__' for :universe:Symbol
from (pry):1:in `__pry__'
[2] pry(main)> :universe.pry
[1] pry(:universe)> :universe.__pry__
=> #<Binding:0xadf1a74>
[2] pry(:universe)>
=> nil
[3] pry(main)> :universe.__pry__
=> #<Binding:0x91a27c4>
[4] pry(main)> :universe.__pry__.eval('self')
=> :universe
```

This is not a rocket science, it simply retrieves a binding of an instance
(recall “Room#window”. “\_\_pry\_\_” is exactly the same). Albeit this
method is not for public use, you can do some interesting things with help of
it. Namely, once “\_\_pry\_\_” is defined, you can peek into objects without prying
into them. It’s kind of a gateway for accessing an object’s internals.

```haskell
[1] pry(main)> 1337.pry
[1] pry(1337)> @leet_number = :so_leet
=> :so_leet
[2] pry(1337)> exit
=> nil
[2] pry(main)> 1337.__pry__.eval('@leet_number')
=> :so_leet
```

Additionally, as I already mentioned, Pry defines the “\_\_binding\_\_” method on
every object. It’s already there, so you don’t need to call “pry” on it.

```haskell
[1] pry(main)> :universe.__binding__.eval 'upcase'
=> :UNIVERSE
```

Why are there two exactly the same methods? Because they are not the
same. “\_\_pry\_\_” is even more internal than “\_\_binding\_\_”, as the latter utilises
the former. So “\_\_binding\_\_” is more powerful. There is no “\_\_pry\_\_” for classes
an modules, but there is always “\_\_binding\_\_”. Do you remember that Pry can
start its session in the context of a Class? This is exactly what “\_\_binding\_\_”
is for.

```ruby
A = Class.new
A.__pry__ #=> NoMethodError
A.__binding__ #=> #<Binding:0xb0e8570>

A.pry
exit # Exits from the nested session.
A.__pry__ #=> NoMethodError, still undefined.
```

So “\_\_pry\_\_” is for instances. For the rest there’s “\_\_binding\_\_”. The context
of evaluation in this case is “self“, as always. Modules also behave as Classes.

```haskell
[1] pry(main)> M = Module.new
=> M
[2] pry(main)> M.__binding__.eval('def magnifico; :splendid end')
=> nil
[3] pry(main)> include M
=> Object
[4] pry(main)> magnifico
=> :splendid
```

This is it. Imagine a REPL. Imagine a context. Tie them together.

```haskell
[1] pry(main)> loop do
             |   print '>> '
             |   puts "=> #{ TOPLEVEL_BINDING.eval(gets) }"
             | end
>> def hello; :hi end
=>
>> hello
=> hi
```

Then, just spice up everything with bindings and you are ready to be famous.

A historical note
-----------------

Roughly speaking, in the early days of Pry everything worked exactly the
same. The API was different, though. There was no “binding.pry” and you had to
“Pry.into(object)”. Nowadays the mechanism has become more robust and easier to
use. I encourage you to check [Pry as it was 3 years ago][old-pry]. It was only
125 lines of code. It’s interesting that the README claimed that “Pry does not
pretend to be a replacement for IRB”. And for the full-featured replacement it
was recommended to use ripl.

Conclusion
----------

“binding.pry” is a very powerful expression. “binding” is powerful by itself,
but if it is assisted with Pry, it reveals unbelievable possibilities. When Pry
starts, it always starts in some context. The default context is “main” (just
like in IRB). But with help of bindings it can load itself wherever a binding is
available. It extends binding’s features with its own ones, allowing excellent
introspection experience, and in the end you get the best Ruby debugging tool
ever existed.

Homework
--------

If you want to become more advanced with Pry and bindings, I offer you three
tasks. The first one is very simple and it’s suitable for every reader of this
article. The next one is simple, too, but it requires some thinking. The last
one is really hard. It’s for passionate Pry users only. It makes you to poke
around the Pry source code, so please, value your time.

### Task 1

Figure out why the `msg` local variable is not accessible. How to inspect its
value?

```ruby
class Duck
  def initialize(name)
    @name = name
  end

  def quack
    msg = 'quack, quack, quack!'
    :binding.pry
    puts "I'm #@name", "I #{ msg }."
  end
end

duck = Duck.new('Donald')
duck.quack
```

<div class="spoiler" data-spoiler-title="The answer to Task 1">
It is not accessible, because we're calling the `pry` method on a symbol. The
solution is to remove the colon from `binding`.
</div>

### Task 2

Run the following snippet like this: `ruby -rpry task2.rb`.

```ruby
# task2.rb

count = 10

def exercise
  binding.pry
end

exercise
```

Without using Pry commands (e.g. “cd”), how to get the value of the count local
variable?

<div class="spoiler" data-spoiler-title="The answer to task 2">
There are at least two ways. One is this: TOPLEVEL_BINDING.eval('count').
However, it won't work in a regular Pry session. What would work is this:
`Pry.toplevel_binding.eval('count')`
</div>

### Task 3

How to swap the top-level binding with a fresh one?

```ruby
[1] pry(main)> count = 1000
=> 1000
[2] pry(main)> # Some lines after...
[3] pry(main)>
[4] pry(main)> count
NameError: undefined local variable or method `count' for main:Object

```

Note that “count = nil” is not the correct solution, as it doesn’t swap the
current binding with a fresh one. Focus on the very bindings, not on garbage
collection and other unrelated things that you might thought of. To complete
this, you only need to swap the current binding object.

<div class="spoiler" data-spoiler-title="The answer to task 3">
`_pry_.binding_stack[0] = __binding__` and `count` is unaccessible!
</div>

Additional reading
------------------

Some people can write better than me. These articles are not about Pry, but by
reading them you’ll be able to understand “binding.pry” even deeper. I heartily
recommend to check them out.

* ["Three implicit contexts in Ruby" by Yuki Sonoda][0]
* "Variable Bindings in Ruby" by Jim Weirich (the website is down)

Did you know?
-------------

Did you know that IRB has basic support for bindings, too? It's not really
enjoyable to work with them there, though.

```haskell
irb(main):001:0> irb "do you hear me?"
irb#1(do you hear me?):001:0> upcase
=> "DO YOU HEAR ME?"
```

Acknowledgements
---------------

Huge thanks to a friend of mine and the creator of Pry, [John Mair](https://twitter.com/banisterfiend), for helping me to polish my language.

Big thanks to [Duncan Beevers](https://twitter.com/duncanbeevers) for the
criticism. I love to be criticised and Duncan is very sincere.

[^1]: More information on “main” can be found in the “[What is the Ruby top-level][top-level-article]” by John Mair
[^2]: That is, [we can’t create our own Binding instances][no-binding-new] using the “#new” method, like we can do it with many other Ruby standard classes.</sub>

      ``Binding.new #=> NoMethodError: undefined method `new' for Binding:Class``

      Binding is somewhat similar to Symbol: there is no need in their
      instantiation. A binding, just like a symbol is already here, ready at hand.

[japanese]: http://qiita.com/yui-knk/items/63a511d243323bec6fb8
[old-pry]: https://github.com/pry/pry/blob/4fcf81b97601945945f43311532c164a93b44d7c/lib/pry.rb
[0]: http://yugui.jp/articles/846
[no-binding-new]: https://github.com/ruby/ruby/blob/0d70d8864359e6d8c410dd2727de618ba7cc3dc7/proc.c#L1583-L1584
[pry-instance]: https://github.com/pry/pry/blob/76d20e1632ffa331536b4f3a19ff96e532e70ac3/lib/pry/pry_instance.rb#L98-L100
[ruby-bug-5360]: http://bugs.ruby-lang.org/issues/5360
[pry-bug-516]: https://github.com/pry/pry/issues/516
[top-level-article]: http://banisterfiend.wordpress.com/2010/11/23/what-is-the-ruby-top-level/
