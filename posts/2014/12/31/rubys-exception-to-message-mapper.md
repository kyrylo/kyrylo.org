Ruby's exception to message mapper
==================================

<p class="post__date"><time datetime="2014-12-31">Dec 31, 2014</time></p>

Exception to message mapper is a Ruby library bundled with the standard Ruby library distribution since Ruby 1.1 (released in the 20th century). It was written by Keiju ISHITSUKA and apparently meant to be used internally, to simplify Ruby's stdlib source code. But since it's available in the stdlib, it's also available for us. You may be wondering what this library is about. Well, guess what?.. It maps messages to exceptions!

Why would you use it
--

Probably you won't use it anyway (and I understand why), but let's imagine a somewhat far-fetched example.
When you define a custom exception it usually doesn't have any context. For example, `ArgumentError` doesn't tell a lot on its own.  If you want to use the exception (that is, you `raise` it), you usually write an accompanying message that explains why this exception is being raised. By doing this you connect the explanation to the exception, which forms 1 logical unit. If your class often raises the same (or almost the same exception), if the exception messages are long, they may clutter the code, because you constantly "connect" explanations. Ever had such problems? It makes sense to refactor the messy code. An exception to message mapper comes to the rescue.

Say you have `Validator`, the ultimate validator class of the new generation that validates everyone and everything. It's simple, but not simple-minded. The validator dislikes and rejects integer `0`, string `"password"` and sneaky SQL queries like `"SELECT * FROM users;"`. If it sees something like that, it whines and raises an exception. Otherwise it returns `true`.

```ruby
class Validator
  class ValidatorError < ArgumentError; end

  def self.validate(datum)
     case datum
     when 0
        raise ValidatorError, "meh, no-one uses zeros in 2014"
     when "password"
       if Time.now.year == 2015
         raise ValidatorError, "meh, no-one uses passwords in 2015"
       else
         true
       end
     when /SELECT \* FROM .+;/i
       raise ValidatorError, "cheating is not allowed"
     else
       true
     end
  end
end
```

As you can see there's a problem with this class: it raises the same exception with almost the same exception message. Let's solve the problem by mapping a predefined message to `Validator::ValidatorError` to remove duplication. No need to reinvent the wheel, we have a handy tool in our tool belt.

Example usage
--

The `e2mmap` library implements an exception to message mapper.
Behind the scenes the implementation uses really [old school Ruby][e2mmap] with `for` loops and whistles but that's none of our concern. Firstly, require `e2mmap`, which defines the `Exception2MessageMapper` class.

```ruby
require 'e2mmap' # From stdlib.
```

Next, let's define a separate module that maps messages to exceptions. It's worth mentioning that you can bake this straight into the `Validator`'s body.

```ruby
class Validator
  module ExceptionsForValidator
    extend Exception2MessageMapper
    def_exception :ValidatorError, "meh, no-one uses %s in %s", ArgumentError
  end
end
```

Here we extended `ExceptionsForValidator` with `e2mmap` and defined a new exception class (`ValidatorError`) with a message attached to it. The message is `"meh, no-one uses %s in %s"`. The `ArgumentError` argument is the superclass of `ValidatorError`.

Now we can use the module in the `Validator` class. We also need to change the implementation of the `.validate` method slightly. In places where we want to reuse our exception message `raise` becomes `Raise`. `Raise` is just a method defined on `self`. It accepts the next arguments: an error class to be raised, the arguments to substitute for `%s`'s in the message.

```ruby
class Validator
  include ValidatorErrors

  def self.validate(datum)
     case datum
     when 0 then Raise ValidatorError, "zeros", 2014
     when "password"
       if Time.now.year == 2015
         Raise ValidatorError, "passwords", 2015
       else
         true
       end
     when /SELECT \* FROM .+;/i
       raise ValidatorError, "cheating is not allowed"
     else
       true
     end
  end
end
```

`e2mmap` does not restrict you to one message. The SQL query example shows that you still can use plain old `raise` with the exception defined via `e2mmap` and pass an arbitrary message.

More features
--

If you prefer to use `fail` instead of `raise`, `e2mmap` includes an alias for `Raise`, which is called `Fail`. You can also use `fail` (`e2mmap` overrides the default `fail`, so I do not recommend to use it in order to avoid confusion).

If you want to use a predefined message for an existing exception, you can use the `def_e2message` method (instead of `def_exception`).

```ruby
require 'e2mmap'

class Validator
  extend Exception2MessageMapper
  def_e2message ArgumentError, "sorry, wrong argument"

  def self.testRaise
    Raise ArgumentError
    # or Fail ArgumentError
    # or fail ArgumentError (not recommended)
  end
end

Validator.testRaise #=> ArgumentError: "sorry, wrong argument"
```

Where does Ruby use `e2mmap` internally? Well, for example, IRB heavily uses it. Other noticeable parts of Ruby's stdlib that use `e2mmap` are [`Matrix`][matrix] and [`Shell`][shell].

Conclusion
--

I've never used this library myself (and never seen it being used in open source projects), and I didn't find *any* mentions of this library on the internet. Hence, someone had to write about it. For additional reference you can [read the source code of the library][doc]. Also, this is probably the last Ruby article of 2014.

Happy New Year!

[e2mmap]: https://github.com/ruby/ruby/blob/2afed6eceff2951b949db7ded8167a75b431bad6/lib/e2mmap.rb
[shell]: https://github.com/ruby/ruby/blob/d371e3583e3b1e0692f92343017b62d2628190ff/lib/shell/error.rb
[matrix]: https://github.com/ruby/ruby/blob/969057c95a4d8c26cf58dd99dff3dbface11f1cd/lib/matrix.rb#L16-L25
[doc]: https://github.com/ruby/ruby/blob/trunk/lib/e2mmap.rb
