function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function toggleClass(el, className) {
  if (el.classList) {
    el.classList.toggle(className);
  } else {
    var classes = el.className.split(' ');
    var existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
    }
    el.className = classes.join(' ');
  }
}

ready(function() {
  //
  // Global
  //
  var codeBlocks = document.querySelectorAll('pre code');
  Array.prototype.forEach.call(codeBlocks, function(el, _i) {
    hljs.highlightBlock(el);
  });

  var avatar = document.querySelector('.banner__avatar');
  var onAvatarHover = function() {
    var link = document.querySelector('.header-title a');
    if (!link) { return; }
    toggleClass(link, 'header-title--highlighted');
  };
  avatar.onmouseenter = onAvatarHover;
  avatar.onmouseleave = onAvatarHover;

  document.querySelector('.wolf-emoji').onclick = function() {
    toggleClass(avatar, 'flip');
  };

  if (document.querySelectorAll('.trip-thumbnails').length) {
    var thumbs = document.querySelectorAll('.trip-thumbnails .trip-thumb img');
    Array.prototype.forEach.call(thumbs, function(el, _i) {
      var link = Array.prototype.filter.call(el.parentNode.children, function(child) {
        return child !== el;
      })[0].querySelector('a');

      el.onclick = function() {
        link.click();
      };

      var hover = function() {
        toggleClass(link, 'highlighted');
      };
      el.onmouseenter = hover;
      el.onmouseleave = hover;
    });
  }
});
