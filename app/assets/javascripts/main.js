$(function() {
  $('#site-logo').hover(function(event) {
    $(event.currentTarget).find('.oddlink').addClass('oddlink--highlighted');
  }, function(event) {
    $(event.currentTarget).find('.oddlink').removeClass('oddlink--highlighted');
  });

  $('.wolf-emoji').on('click', function() {
    $('.avatar').click();
  });

  $('pre code').each(function(_i, e) {
    hljs.highlightBlock(e);
  });
});

window.blockFotoramaData = true;
