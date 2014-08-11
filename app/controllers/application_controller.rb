class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def renderer
    opts = {
      fenced_code_blocks: true,
      superscript: true,
      footnotes: true,
      no_intra_emphasis: true,
      lax_html_blocks: true,
      autolink: true,
      tables: true
    }
    @renderer ||= Redcarpet::Markdown.new(Redcarpet::Render::HTML, opts)
  end


  def parse_markdown_headers(markdown)
    m = Metadown.render(markdown)
    [m.output, m.metadata]
  end
end
