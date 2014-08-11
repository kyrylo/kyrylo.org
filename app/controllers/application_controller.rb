class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def renderer
    @renderer ||= Redcarpet::Markdown.new(Redcarpet::Render::HTML)
  end


  def parse_markdown_headers(markdown)
    m = Metadown.render(markdown)
    [m.output, m.metadata]
  end
end
