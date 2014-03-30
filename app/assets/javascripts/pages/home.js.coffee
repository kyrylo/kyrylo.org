$ ->
  $('.avatar').on(click: ->
    $(this).toggleClass('flip')
  ).hover ->
    $(this).find('img').toggleClass('hovered')
