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

  $('.spoiler').spoiler()
  $('.spoiler').each (_, spoiler) ->
    title = $(spoiler).data('spoiler-title')
    $(spoiler).prevAll('.btn-spoiler:first').text(title)

  if window.location.pathname is '/articles'
    $('.post-content .cut').parent().nextUntil('.hr').wrapAll('<div class="uncut">')
      .hide().promise().done ->
        $('.post-content .uncut')
          .after('<button class="continue-reading">Continue reading <i class="fa fa-long-arrow-right"></i></button>')

    $('.post-content .continue-reading').click ->
      $('.post-content .uncut *').slideDown(450)
      $(this).hide()
