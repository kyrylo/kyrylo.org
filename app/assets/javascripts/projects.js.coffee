$ ->
  $('.thumbimg a').hover(
    -> $(this).parents().eq(1).find('.title a').addClass('hovered'),
    -> $(this).parents().eq(1).find('.title a').removeClass('hovered')
  )
