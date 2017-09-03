$(function() {
  if ($('.trip-thumbnails').length) {
    $('.trip-thumb img').click(function() {
      $(this).siblings('.caption').find('a')[0].click();
    });

    $('.trip-thumb img').mouseover(function() {
      $(this).siblings('.caption').find('a').addClass('highlighted');
    });

    $('.trip-thumb img').mouseout(function() {
      $(this).siblings('.caption').find('a').removeClass('highlighted');
    });
  }
});
