class PagesController < ApplicationController
  def home
    @posts = Post.order('created_at ASC').all
  end

  def about
    markdown = File.read(File.expand_path('app/views/pages/about.md'))
    output, m = parse_markdown_headers(markdown)
    @title = m['title']
    @about = renderer.render(output).html_safe
  end
end
