$ ->
  $('.thumbimg a').hover(
    -> $(this).parents().eq(1).find('.title a').addClass('hovered'),
    -> $(this).parents().eq(1).find('.title a').removeClass('hovered')
  )

  $('.tooltip').tooltipster
    fixedWidth: false
    maxWidth: 350
    delay: 0
    position: 'right'
    contentAsHTML: true
    theme: 'tooltipster-kyrylo-theme'
    trigger: 'click'
    speed: 200
    interactive: true
