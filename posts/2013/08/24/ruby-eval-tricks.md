Ruby eval tricks
================

<time datetime="2013-08-24">Aug 24, 2013</time>

Greetings upon thee! Let's evaluate some code for breakfast, cousins.

```ruby
eval "100 + 1\n (42 + 100)"   #=> 142
eval "100 + 1\n + (42 + 100)" #=> 142
```

The first line shouldn't be hard for understanding. We evaluate two lines of
Ruby code. The second example does the same. The second line uses an unary
operator: `+(42 + 100)`.

"We demand lunch now!"

```ruby
eval "100 +\n (42 + 100)"   #=> 242
eval "100 +\n + (42 + 100)" #=> 242
```

Again, we do the same thing. Here we just sum the `100` from the first line with
the second line. Straightforward.

"Where is our dinner?!"

```ruby
eval "100.+(1\n.+(42 + 100))" #=> 243
eval "100.+(1)\n (42 + 100)"  #=> 142
```

Brackets change the game. The first line evaluates to a different result (in
comparison with the breakfast result). The second line is obvious.

"But we want more!"

```ruby
eval "100 + (42\n+ 100)"  #=> 200
eval "100 + (42 +\n 100)" #=> 242
```

Okay-okay! This is something unexpected. What's going on? The first line seems
to be illogical. Where does the `42` go? Let's see what the VM receives.

```ruby
puts RubyVM::InstructionSequence.compile("100 + (42\n+ 100)").disassemble
```
```
== disasm: <RubyVM::InstructionSequence:<compiled>@<compiled>>==========
0000 trace            1                                               (   2)
0002 putobject        100                                             (   1)
0004 trace            1                                               (   2)
0006 putobject        100
0008 opt_send_simple  <callinfo!mid:+@, argc:0, ARGS_SKIP>
0010 opt_plus         <callinfo!mid:+, argc:1, ARGS_SKIP>
0012 leave
```

Where are you, `42`?

```ruby
eval "100 + (puts 'omg'\n+ 100)"
omg
#=> 200
```

Here's the disassembled sequence.

```
== disasm: <RubyVM::InstructionSequence:<compiled>@<compiled>>==========
0000 trace            1                                               (   2)
0002 putobject        100                                             (   1)
0004 trace            1
0006 putself
0007 putstring        "omg"
0009 opt_send_without_block <callinfo!mid:puts, argc:1, FCALL|ARGS_SIMPLE>
0011 pop
0012 trace            1                                               (   2)
0014 putobject        100
0016 opt_send_without_block <callinfo!mid:+@, argc:0, ARGS_SIMPLE>
0018 opt_plus         <callinfo!mid:+, argc:1, ARGS_SIMPLE>
0020 leave
```

As some smart folks pointed out the trick is that `\n` is being replaced by `;`.
So the following two expressions are identical.

```ruby
eval "100 + (puts 'omg'\n+ 100)"
eval "100 + (puts 'omg';+ 100)"
```
