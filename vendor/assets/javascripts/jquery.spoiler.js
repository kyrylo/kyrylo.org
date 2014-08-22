/*
 * jQuery Spoiler
 * Created 2014 Triangle717
 * <http://Triangle717.WordPress.com/>
 *
 * Licensed under The MIT License
 * <http://opensource.org/licenses/MIT/>
 */

(function (factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["jquery"], factory);
  } else if (typeof exports === "object") {
    // Node/CommonJS style for Browserify
    module.exports = factory;
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {
  "use strict";
  $.fn.spoiler = function(options) {
    // Default options
    var settings = $.extend({
      buttonName         : "Spoiler",
      buttonClass        : "btn-spoiler",
      paddingValue       : 6,
      triggerEvents      : false,
      includePadding     : true,
      buttonActiveName   : "Spoiler",
      buttonActiveClass  : "btn-spoiler-active",
      spoilerVisibleClass: "spoiler-visible"
    }, options);

    // Variables for usage
    var btnID          = 0,
        spoilerID      = 0,
        buttonClass    = "." + settings.buttonClass,
        spoilerHeights = [];

    // Assign IDs to each spoiler
    $(this).each(function() {
      var $this = $(this);
      $this.attr("id", $this.attr("class") + "-" + spoilerID);
      spoilerID += 1;

      // The only CSS requirement for this to work for the spoilered content
      // to have an overflow: hidden rule applied.
      $this.css("overflow", "hidden");

      // Get the height of the content to be spoilered now,
      // as once we hide the text it cannot be restored.
      // Use the value of `scrollHeight`, which does not change
      // even if a height is applied through CSS.
      var contentHight = $this.prop("scrollHeight");

      // Add padding to bottom of container only if enabled
      contentHight = (settings.includePadding ? 
                      contentHight + parseInt(settings.paddingValue) : contentHight);
      spoilerHeights.push(contentHight + "px");
    });

    // Add the toggle button
    $(this).before("<div class='" + settings.buttonClass + "'><div>" +
                   settings.buttonName + "</div></div>");

    // Add matching IDs to each toggle button
    $(buttonClass).each(function() {
      $(this).attr("id", settings.buttonClass + "-" + btnID);
      btnID += 1;
    });

    // Now that we have the height, hide all content
    $(this).css("height", "0");

    $(buttonClass).on("click", function() {
      // Get the ID for the clicked spoiler button so only that one is triggered
      var spoilerID  = "#" + $(this).attr("id").replace(/btn-/i, ""),
          spoilerNum = spoilerID.slice(spoilerID.length - 1),
          $button    = $(this),
          $content   = $(spoilerID);

      // The container's collapsed/expanded height values
      var showContent = {"height": spoilerHeights[spoilerNum]},
          hideContent = {"height": "0"};

      // Check if content is visible or not
      var contentVisible = $content.hasClass(settings.spoilerVisibleClass);

      // Hide/show content
      if (contentVisible) {
        $content.css(hideContent);
      } else {
        $content.css(showContent);
      }

      // If enabled, trigger events upon show/hide
      if (settings.triggerEvents) {
        if (contentVisible) {
          $content.trigger("contenthidden");
        } else {
          $content.trigger("contentvisible");
        }
      }

      // If enabled, display different button label on active state
      if (settings.buttonActiveName !== settings.buttonName) {
        if (contentVisible) {
          $("#" + $button.attr("id") + " div").html(settings.buttonName);
        } else {
          $("#" + $button.attr("id") + " div").html(settings.buttonActiveName);
        }
      }

      // Toggle between active classes for both container and button
      $content.toggleClass(settings.spoilerVisibleClass);
      $button.toggleClass(settings.buttonActiveClass);
    });
    return this;
  };
}));
