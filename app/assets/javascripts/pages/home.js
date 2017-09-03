$(function() {
  $('.avatar').on({
    click: function() {
      $(this).toggleClass('flip');
    }
  }).hover(function() {
    $(this).find('img').toggleClass('hovered');
  });
});
