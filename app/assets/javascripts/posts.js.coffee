$ ->
  if $('#ace').length
    editor = ace.edit('ace')
    $post_markdown = $('#post_markdown')
    editor.setTheme('ace/theme/github')
    MarkdownMode = require('ace/mode/markdown').Mode
    editor.getSession().setMode(new MarkdownMode())
    editor.setValue($post_markdown.text(), -1)

  $('.submit-btn').click ->
    $post_markdown.text(editor.getValue())
