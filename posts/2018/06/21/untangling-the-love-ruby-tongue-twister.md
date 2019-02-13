Untangling the "love" Ruby tongue twister
=========================================

<time datetime="2018-06-21">June 21, 2018</time>

I found an interesting Ruby tongue twister:
https://twitter.com/josh_cheek/status/1008910880761761792

```
ruby -e '
%%%%%%%%%%%%%%%%%%%%%%%
public def /*; self end
public def _*; self end
{}./{//}./$\,//./,//,$,
$.._$,,%,?,,?,,$_,$?,??
//=~$/&&__=-11+_=$.+111
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
%%%%%%%%%%%%%%%%%%%%%%%
'
love
```

As you can see, this program prints "love\n". At a cursory glance it's not
obvious what is going on here. Let's untangle it step by step.

Lines 1, 12
-----------

The first (and twelfth) line means nothing but an empty string.

```
>> %%%%%%%%%%%%%%%%%%%%%%%
=> ""
```

Let's decompose it in a more meaningful way.

```
>> %%% % %%% % %%% % %%% % %%% % %%%
=> ""
```

How's this more meaningful? Well, this line defines 6 Strings and merges them
together with help of
[`String#%`](https://ruby-doc.org/core-2.5.0/String.html#method-i-25).

```
>> %%%
>> ""
```

In Ruby you can create strings like this:

```
>> %(foo)
>> "foo"
```

So `%` is also a valid delimiter.

```
>> %%foo%
>> "foo"
```

Therefore, `%%%` creates an empty string and calls `%` on it passing another
`%%%`. So, this line is a mere dud. Let's remove it from the program
(also the last line since it does exactly the same thing).

We're left with this:

```
public def /*; self end
public def _*; self end
{}./{//}./$\,//./,//,$,
$.._$,,%,?,,?,,$_,$?,??
//=~$/&&__=-11+_=$.+111
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
```

Lines 2, 3
----------

The next line defines the `/` method on Object, which accepts any number of
arguments. It returns `self`. The word `public`, here, is necessary because by
default, methods defined on `Object` are private. The program wants it to be
public so it can use it on any object. The bonus point is that it makes the
program look more rectangular and pretty (in its original form).

```
public def /(*)
  self
end
```

The next line does exactly the same as the previous one, so `_` is simply an
alias for `/`. This line is an equivalent (just in case if it makes
understanding easier for you).

```
alias _ /
```

This is what we are left with so far:

```
{}./{//}./$\,//./,//,$,
$.._$,,%,?,,?,,$_,$?,??
//=~$/&&__=-11+_=$.+111
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
```

Line 4
------

So the next line is actualy where it gets tricky.

```
>> {}./{//}./$\,//./,//,$,
=> {}
```

Let's break it down. First, we call `/` on Hash:

```
>> {}./{//}
=> {}
```

Because we defined `Object#/`, Hash and other objects automatically get this
method, too. So, we create an empty Hash and call `/`, and we also pass a block!
Let me rewrite it in a more verbose manner to demonstrate the intent.

```
>> {}./(&proc { // })
=> {}
```

The block carries an empty Regexp but it's never executed. It's just a dud. The
call returns `self` (hence the original hash `{}`).

This is what's left:

```
>> a = {}./{//}
=> {}
>> a./$\,//./,//,$,
=> {}
```

Let's move to the next part. We can see the same trick with calling `/`, but
there's a twist. We pass more arguments to it. It's hard to see what's going on
when everything is on one line, so splitting it into multiple lines gives a
good overview.

```
a./(
  $\,
  //./(),
  //,
  $,
)
```

Four arguments are passed here:

* `$\` is a global variable
* `//./()` is just a `/` call on an empty Regexp without passing any arguments
* `//` an empty Regexp
* `$,` a global variable (which is not defined by Ruby; any undefined global
  variable is `nil`)

Therefore, this expression returns `a`, since `/` returns `self`. Yet another
dud!

We're left with this:

```
$.._$,,%,?,,?,,$_,$?,??
//=~$/&&__=-11+_=$.+111
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
```

Line 5
------

Let's see what's going on with the next line.

```
>> $.._$,,%,?,,?,,$_,$?,??
=> 1
```

Interesting, the result is 1 this time. `$.` calls `_` (which is an alias to `/`
and returns `self`). `$.` is the line number last read by interpreter, so in the
context of a REPL it's equal to 1 (this is my assistant at this job). However,
if we execute the code directly on the Ruby interpreter, it will be equal to 0.
Let's keep this in mind.

```
ruby -e '
%%%%%%%%%%%%%%%%%%%%%%%
public def /*; self end
public def _*; self end
{}./{//}./$\,//./,//,$,
p $.._$,,%,?,,?,,$_,$?,??
'
0
'
```

Presumably, it starts counting from 0 and since this is technically the only
line to read, it stays at 0 forever if you use the `-e` flag.

What comes after `$.._` is actually a list of arguments:

```
$.._(
  $,,
  %,?,,
  ?,,
  $_,
  $?,
  ??
)
```

* `$,` is a global variable
* `%,?,,` is the "?" string. The string is delimited by commas (`%,foo,` is
  `"foo"`)
* `?,` is a single character `","`
* `$_` is a global variable
* `$?` is a global variable,
* `??` is a single character `"?"`

Onto the next line!

Line 6
------

```
>> //=~$/&&__=-11+_=$.+111
=> 101
```

Let's break it down.

```
>> // =~ $/ && __ =- 11 + _ = $. + 111
=> 101
>> (// =~ $/) && (__ =- 11 + _ = $. + 111)
=> 101
>> // =~ $/
=> 0
```

There's no fancy stuff going on here, this is just normal Ruby packed tightly.
We evaluated the first part, which is 0 and it's irrelevant to the returned
result. Let's see what happens to the second part.

```
>> __ =- 11 + _ = $. + 111
=> 101
```

This is where 101 is coming from. The computation is based on priority
rules. Brackets should make this clear.

```
>> _ = $. + 111
>> p _
=> 112
```

`_` is simply a variable name here. The last part is a little tricky because I
formatted it incorrectly. Check this.

```
>> __ =- 11 + 112
=> 101
>> __ = -11 + 112
=> 101
```

See what I did there? `=-` can be easily confused with `-=` (a shorthand for
subtraction). Now when this is formatted properly, it's so easy to see that
it's just a simple assignment to `__`.

One final detail that I need to mention is that 112 & 101 is the result you see
if you tinker with this in a REPL. If you run the actual program, `$.` will be 0
instead of 1 (as I mentioned before), therefore the result of the evaluation
will be 111 & 100, respectively.

We are left with the following code:

```
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
```

Lines 7, 8, 9
-------------

Not much left to untangle, but we still don't know why the program prints
`love`. Running the next line on its own leaves us out of luck:

```
% ruby -e '$><<<<-"<<<"<<<<-"<<"<<'
-e:1: can't find string "<<<" anywhere before EOF
-e:1: syntax error, unexpected end-of-input, expecting tSTRING_CONTENT or tSTRING_DBEG or tSTRING_DVAR or tSTRING_END
$><<<<-"<<<"<<<<-"<<"<<
            ^
```

Actually, even if we run the whole chunk that is left, we will see that it
doesn't work:

```
ruby -e '
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
'
-e:5:in `<main>': undefined method `-' for main:Object (NoMethodError)
```

`NoMethodError` gives us a clue. Something should be defined but it's not.
Remember we assigned a few variables (`_` & `__`) on the previous line?
Seems like they're important. Let's test:

```
ruby -e '
//=~$/&&__=-11+_=$.+111
$><<<<-"<<<"<<<<-"<<"<<
           <<<
         <<
($`<<_-3<<_<<_+7<<-~__)
$<&&$><<$/&&?&&&%&&&&?&
'
love
```

Looks like the rest of the program relies on these variables. Let's continue
and analyse line `$><<<<-"<<<"<<<<-"<<"<<`. The first two characters is a
global variable `$>`, which represents `STDOUT`. What comes next is a little
confusing, so let's evaluate the full line to see what happens:

```
ruby -e '$><<<<-"<<<"<<<<-"<<"<<'
-e:1: can't find string "<<<" anywhere before EOF
-e:1: syntax error, unexpected end-of-input, expecting tSTRING_CONTENT or tSTRING_DBEG or tSTRING_DVAR or tSTRING_END
$><<<<-"<<<"<<<<-"<<"<<
            ^
```

I see, it looks like `<<<` is a heredoc. Actually, even two heredocs!

```
$> <<(<<-"<<<")<<(<<-"<<")<<
```

Now we can see that we have three `<<` patterns and actually they are
[`IO#<<`](https://ruby-doc.org/core-2.5.0/IO.html#method-i-3C-3C) calls.

```
$> << (<<-"<<<") << (<<-"<<") <<
```

This line terminates with a `<<` method call, which means the expression is
still not over. Moreover, we must close two heredocs. This is precisely what
happens on the next two lines.

```
$> << (<<-"<<<") << (<<-"<<") <<
            <<<
          <<
```

It's obvious now that `<<<` & `<<` close heredocs, but what do they produce?
Well, indentation doesn't matter here, we can easily rewrite it like this and it
will be the same.

```
$> << (<<-"<<<") << (<<-"<<") <<
<<<
<<
```

So, it produces two empty strings. Let's substitute them.

```
$> << "" << "" <<
```

After these permutations the code can be understood by anybody and it makes
perfect sense why the expression isn't over yet. We're still appending! Let's
analyse what's going on with the next line. After all, it's still not clear
where `love` comes from.

Line 10
-------

Let's evaluate the next line ``($`<<_-3<<_<<_+7<<-~__)``. If you run that as is,
it will produce an error.

```
ruby -e '
($`<<_-3<<_<<_+7<<-~__)
'
-e:2:in `<main>': undefined local variable or method `_' for main:Object (NameError)
```

Cor blimey! So the assignments on one of the previous lines are actually very
relevant now (`//=~$/&&__=-11+_=$.+111`). Remember, `_` is 111 & `__` is 100.

Let's substitute...

```
($`<<111-3<<111<<111+7<<-~100)
```

...calculate and format:

```
$` << 108 << 111 << 118 << 101
```

Simple, eh? `` $` `` is the string preceding the match in the last successful
pattern match. Remember, we've matched an empty string? Therefore, it's equal
to `""`.

```
>> "" << 108 << 111 << 118 << 101
=> "love"
```

Now, when you evaluate that, you get `"love"`! There's a little known gotcha
when you use
[`String#<<`](https://ruby-doc.org/core-2.5.0/String.html#method-i-3C-3C). If
the object you append is an Integer, then it is considered a codepoint and
converted to a character before being appended. That's exactly what happened
here. `108, 111, 118, 101` are codepoints for `l, o, v, e`.

Because this line is actually an argument to the previous line, we do need to
wrap it in brackets.

```
("love")
```

We are very close to untangling this guy. The only mystery that is left is
where the newline is coming from.

Line 11
-------

This is the last line of the program that we need to untangle. Let's sharpen our
keyboard and break it down.

```
$< && $> << $/ && ?& && %&& && ?&
```

Even after I delimited it with spaces it still looks a little cryptic. Let's spice
it up with some brackets.

```
($<) && ($> << ($/) && (?& && %&& && ?&))
```

So, the first part is `($<)`. It's a dud that we can ignore. What actually
gets returned is the rest of the expression. We use `$>` (STDOUT) again and
pass it some arguments.

```
$> << ($/) && (?& && %&& && ?&)
```

Let's decompose arguments. It's not obvious, but `$/` is actually an argument of
`IO#<<`. Global variable `$/` is an input record separator (defaults to `"\n"`),
so that's how we print the final newline. What comes after it is a dud,
which evaluates to `"&"`.

The tricky part is the `%&&` empty string which is hard to see if it's not
delimited by spaces.

```
>> %&&
>> ""
```

`?&` is a character `&`. Therefore, this expression evaluates to it:


```
>> (?& && %&& && ?&)
=> "&"
```

Let's substitute `"&"`, and this is what we have now:

```
$>.<<($/) && "&"
```

Because of priority rules we can safely strip it down to (the ampersand string is never evaluated):

```
$> << $/
```

But wait, how does the actual printing occur? Well, in order to print what we
pass to STDOUT, the string must end with a newline and this is what we just did
here. That's why there are no `puts` calls anywhere.

Conclusion
----------

Let's run this program with all the substitutions we've
made so far to verify it still produces the same result.

```
ruby -e '
""                                # line 1
public def /(*)                   # line 2
  self
end
alias _ /                         # line 3
a = {}./(&proc { // })            # line 4
a./(
  $\,
  //./(),
  //,
  $,
)
$.._(                             # line 5
  $,,
  %,?,,
  ?,,
  $_,
  $?,
  ??
)
// =~ $/                          # line 6
__ = 100
_ = 111
$> << "" << "" <<                 # lines 7, 8, 9
("love")                          # line 10
$> << $/                          # line 11
""                                # line 12
'
love
```

Looking good, still works, mystery untangled! Thanks to Josh Cheek for this Ruby
tongue twister, I had a good brain tickling session.
