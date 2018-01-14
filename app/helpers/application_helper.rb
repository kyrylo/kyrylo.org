module ApplicationHelper
  MOTTO = 'Kyrylo Silin &middot; Black & White'.freeze

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

  def site_title
    content_tag(:div, class: 'header-logo') do
      link = current_page?(root_url) ? '' : 'header-logo__link'

      concat(
        content_tag(:div, class: "header-logo__author #{link}") { 'Kyrylo Silin' }
      )
      concat(
        content_tag(:div, class: "header-logo__slogan #{link}") do
          'Black &amp; White'.html_safe
        end
      )
    end
  end

  def generate_title(title)
    return raw(MOTTO) unless title
    raw("#{title} &mdash; #{MOTTO}")
  end

  def retina_img(filename, *args)
    file, ext = filename.split('.')
    args.first[:srcset] = image_path(filename) + ' 1x, '
    args.first[:srcset] << image_path("#{file}@2x.#{ext}") + ' 2x'
    image_tag("/#{filename}", *args)
  end
end
