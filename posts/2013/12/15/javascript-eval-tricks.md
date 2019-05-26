JavaScript eval tricks
======================

<p class="post__date"><time datetime="2013-12-15">Dec 15, 2013</time></p>

By default, `eval` evaluates code in the current context.

```js
var x = 0;

function foo() {
  var x = 5;
  eval('x = 100');
  return x;
}

x; // 0
foo(); // 100
x; // 0
```

However, there's a trick to confuse everyone.

<span class="cut"></span>

If we assign the `eval` function to a variable, the function inside that
variable "detaches" from the current context: `this` becomes the global object.

```js
var x = 0;

function bar() {
  var x = 5,
      evil = eval;
  evil('x = 100');
  return x;
}

x; // 0
bar(); // 5
x; // 100
```

This is how you could write the function (don't do that!) to make everyone
superconfused.

```js
var x = 0;

function baz() {
  var x = 5,
      evil = eval.call(this, 'eval');
  evil('x = 100');
  return x;
}

x; // 0
baz(); // 100
x; // 0
```

JS is cool.
