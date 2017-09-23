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
  document.querySelector('.header-logo').onmouseenter = function(event) {
    var links = event.currentTarget.querySelectorAll('.header-logo__link');
    if (!links.length) {
      return;
    }
    Array.prototype.forEach.call(links, function(el, _i) {
      addClass(el, 'header-logo__link--highlighted');
    });
  };

  var onLogoHover = function(event) {
    var links = event.currentTarget.querySelectorAll('.header-logo__link');
    if (!links.length) {
      return;
    }
    Array.prototype.forEach.call(links, function(el, _i) {
      toggleClass(el, 'header-logo__link--highlighted');
    });
  };
  document.querySelector('.header-logo').onmouseenter = onLogoHover;
  document.querySelector('.header-logo').onmouseleave = onLogoHover;

  var codeBlocks = document.querySelectorAll('pre code');
  Array.prototype.forEach.call(codeBlocks, function(el, _i) {
    hljs.highlightBlock(el);
  });

  //
  // Home
  //
  var avatar = document.querySelector('.banner__avatar');
  if (avatar) {
    avatar.onclick = function() {
      toggleClass(this, 'flip');
    };

    var onAvatarHover = function() {
      var imgs = this.querySelectorAll('img');
      Array.prototype.forEach.call(imgs, function(el, _i) {
        toggleClass(el, 'hovered');
      });
    };
    avatar.onmouseenter = onAvatarHover;
    avatar.onmouseleave = onAvatarHover;
  }

  var wolfEmoji = document.querySelector('.wolf-emoji');
  if (wolfEmoji && avatar) {
    wolfEmoji.onclick = function() {
      avatar.click();
    };
  }

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
