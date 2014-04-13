module ApplicationHelper
  # Appears on every page (at the top).
  # @return [Array<String>] the main menu entries
  MENU_ITEMS = %W|Projects|

  # Creates the HTML element &lt;figure&gt; with an optional <figcaption>.
  # @example
  #   figure_tag('avatar.png', size: '50x50', figcaption: 'Avatar')
  #   figure_tag('avatar.png', size: '50x50')
  #   figure_tag('avatar.png')
  # @param [String] source the path to the image
  # @param [Hash] opts the options for the figure (+:figcaption+ plus
  #   image_tag's parameters)
  # @option opts [String] :figcaption (nil) The figure's caption
  # @return [ActiveSupport::SafeBuffer] the HTML for the figure
  # @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
  def figure_tag(source, opts = {})
    caption = opts.delete(:figcaption)
    content_tag(:figure) do
      image_tag(source, opts) + (content_tag(:figcaption, caption) if caption)
    end
  end

  # Converts the +menu_item+ to the path.
  # @example
  #   pathify('Friends') #=> "/friends"
  # @param [String] menu_item must be a single plural word
  # @return [String] the path to the resource
  def pathify(menu_item)
    __send__("#{ menu_item.downcase }_path")
  end
end
