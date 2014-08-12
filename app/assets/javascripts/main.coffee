$ ->
  $('.date').each (idx, date) ->
    published = moment($(date).text()).fromNow()
    $(this).text("Published #{published}")

  hljs.initHighlightingOnLoad()
