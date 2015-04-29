$ ->
  if $('.trip-thumbnails').length
    $('.trip-thumb img').click ->
      $(this).siblings('.caption').find('a')[0].click()

    $('.trip-thumb img').mouseover ->
      $(this).siblings('.caption').find('a').addClass('highlighted')

    $('.trip-thumb img').mouseout ->
      $(this).siblings('.caption').find('a').removeClass('highlighted')
