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

  private

  def render_markdown(file)
    markdown = File.read(File.expand_path('app/views/pages/' + file))
    output, m = parse_markdown_headers(markdown)
    @title = m['title']
    @about = renderer.render(output).html_safe
  end
end
