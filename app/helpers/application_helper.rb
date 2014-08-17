module ApplicationHelper
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

  def render_tags(tags)
    tags.map(&:to_s).sort.map do |tag|
      link_to(tag, tag)
    end.join(', ').html_safe
  end

  def site_title
    content_tag(:div, id: 'site-title') do
      concat(content_tag(:div, class: 'author oddlink') { 'Kyrylo Silin' })
      concat(content_tag(:div, class: 'oddlink') do
          '&ldquo;Only Black and White&rdquo;'.html_safe
        end)
    end
  end
end
