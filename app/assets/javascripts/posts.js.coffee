$ ->
  # ACE editor
  #
  if $('#ace').length
    editor = ace.edit('ace')
    if ($markdown = $('#post_markdown')).length ||
      ($markdown = $('#trip_markdown')).length ||
      ($markdown = $('#project_markdown')).length ||
      ($markdown = $('#devlog_entry_markdown')).length
        editor.setTheme('ace/theme/github')
        MarkdownMode = require('ace/mode/markdown').Mode
        editor.getSession().setMode(new MarkdownMode())
        editor.setValue($markdown.text(), -1)

  $('.submit-btn').click ->
    $markdown.text(editor.getValue())

  $('.spoiler').spoiler()
  $('.spoiler').each (_, spoiler) ->
    title = $(spoiler).data('spoiler-title')
    $(spoiler).prevAll('.btn-spoiler:first').text(title)

  # Cut
  #
  if window.location.pathname is '/articles'
    $('.post-content .cut').parent().each (i, cut) ->
      $cut = $(cut)
      $cut.nextUntil('.hr').wrapAll('<div class="uncut">').hide().promise().done ->
        $cut.siblings('.uncut').after('<button class="continue-reading">Continue reading <i class="fa fa-long-arrow-right"></i></button>')

    $('.post-content .continue-reading').click ->
      $(this).parent().find('.uncut *').slideDown(450)
      $(this).hide()
