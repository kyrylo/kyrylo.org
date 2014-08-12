$ ->
  $('.date').each (idx, date) ->
    published = moment($(date).text()).fromNow()
    $(this).text(published)

  hljs.initHighlightingOnLoad()
