$(function() {
  if ($('#ace').length) {
    var $markdown,
        editor = ace.edit('ace');
    if (($markdown = $('#post_markdown')).length ||
        ($markdown = $('#trip_markdown')).length ||
        ($markdown = $('#project_markdown')).length) {
      editor.setTheme('ace/theme/github');
      var MarkdownMode = require('ace/mode/markdown').Mode;
      editor.getSession().setMode(new MarkdownMode());
      editor.setValue($markdown.text(), -1);
    }
  }

  $('.submit-btn').click(function() {
    $markdown.text(editor.getValue());
  });
});
