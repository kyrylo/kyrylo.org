$ ->
  # ACE editor
  #
  if $('#ace').length
    editor = ace.edit('ace')
    if ($markdown = $('#post_markdown')).length ||
      ($markdown = $('#trip_markdown')).length ||
      ($markdown = $('#project_markdown')).length
        editor.setTheme('ace/theme/github')
        MarkdownMode = require('ace/mode/markdown').Mode
        editor.getSession().setMode(new MarkdownMode())
        editor.setValue($markdown.text(), -1)

  $('.submit-btn').click ->
    $markdown.text(editor.getValue())
