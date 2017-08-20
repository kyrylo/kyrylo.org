# coding: utf-8
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
      link_to(tag, "/#{tag}")
    end.join(', ').html_safe
  end

  def site_title
    content_tag(:div, id: 'site-title') do
      oddlink = current_page?(root_url) ? '' : 'oddlink'

      concat(content_tag(:div, class: "author #{oddlink}") { 'Kyrylo Silin' })
      concat(
        content_tag(:div, class: "slogan #{oddlink}") do
          'Black &amp; White'.html_safe
        end
      )
    end
  end

  def generate_title(str)
    motto = 'Kyrylo Silin &middot; Black & White'.html_safe
    str && str.html_safe + " &mdash; #{motto}".html_safe || motto.html_safe
  end

  def image_tag_with_at2x(name_at_1x, options={})
    name_at_2x = name_at_1x.gsub(%r{\.\w+$}, '@2x\0')
    image_tag(name_at_1x, options.merge('data-at2x' => asset_path(name_at_2x)))
  end
end
