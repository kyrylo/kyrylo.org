$ ->
  $('.date').each (idx, date) ->
    published = moment($(date).text().trim()).fromNow()
    $(this).text(published)

  hljs.initHighlightingOnLoad()

$(document).on 'page:change', ->
  $('pre code').each (i, e) -> hljs.highlightBlock(e)

$(document).on 'page:restore', ->
  $('pre code').each (i, e) -> hljs.highlightBlock(e)

window.blockFotoramaData = true
