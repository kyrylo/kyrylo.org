$ ->
  $('.date').each (idx, date) ->
    published = moment($(date).text().trim()).fromNow()
    $(this).text(published)

  hljs.initHighlightingOnLoad()

  $('#site-logo').hover (event) ->
    $(event.currentTarget).find('.oddlink').addClass('oddlink--highlighted')
  , (event) ->
    $(event.currentTarget).find('.oddlink').removeClass('oddlink--highlighted')

  $('.wolf-emoji').on 'click', ->
    $('.avatar').click()

$(document).on 'page:change', ->
  $('pre code').each (i, e) -> hljs.highlightBlock(e)

$(document).on 'page:restore', ->
  $('pre code').each (i, e) -> hljs.highlightBlock(e)

window.blockFotoramaData = true
