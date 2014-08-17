class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  HEADER_REGEXP = /\A---(.*?)---(.*)/m

  class SmartHTML < Redcarpet::Render::HTML
    include Redcarpet::Render::SmartyPants
  end

  def renderer
    @renderer ||= Redcarpet::Markdown.new(SmartHTML, {
        fenced_code_blocks: true,
        superscript: true,
        footnotes: true,
        no_intra_emphasis: true,
        lax_html_blocks: true,
        autolink: true,
        tables: true,
        autolink: true,
        strikethrough: true
      }
    )
  end


  def parse_markdown_headers(markdown)
    m = Metadown.render(markdown)
    m.metadata
  end

  def strip_header(markdown)
    content = HEADER_REGEXP.match(markdown)
    return markdown unless content
    content[2].strip
  end
end
