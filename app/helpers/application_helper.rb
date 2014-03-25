module ApplicationHelper
  # Creates the HTML element &lt;figure&gt; with an optional <figcaption>.
  # @example
  #   figure_tag('avatar.png', size: '50x50', figcaption: 'Avatar')
  #   figure_tag('avatar.png', size: '50x50')
  # @param [String] source the path to the image
  # @param [Hash] opts the options for the figure (+:figcaption+ plus image_tag's
  #   parameters)
  # @option opts [String] :figcaption (nil) The figure's caption
  # @return [ActiveSupport::SafeBuffer] the HTML for the figure
  # @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
  def figure_tag(source, opts = {})
    caption = opts.delete(:figcaption)
    content_tag(:figure) do
      image_tag(source, opts) + (content_tag(:figcaption, caption) if caption)
    end
  end
end
