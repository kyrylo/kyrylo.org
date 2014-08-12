class PagesController < ApplicationController
  def home
    @posts = Post.order('created_at ASC').all
  end

  def about
    render_markdown('about.md')
  end

  def acknowledgements
    render_markdown('acknowledgements.md')
  end

  def public_accounts
    render_markdown('public_accounts.md')
  end

  private

  def render_markdown(file)
    markdown = File.read(File.expand_path('app/views/pages/' + file))
    headers = parse_markdown_headers(markdown)
    @title = headers['title']
    @about = renderer.render(strip_header(markdown)).html_safe
  end
end
