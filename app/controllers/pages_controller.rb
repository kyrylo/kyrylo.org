class PagesController < ApplicationController

  def home
    posts = Post.order('created_at DESC')
    @grouped_posts = posts.group_by { |post| post.created_at.year }
    @grouped_posts.each do |year, post|
      @grouped_posts[year] = post.group_by { |p| p.type }
    end
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

  def tag

  end

  private

  def render_markdown(file)
    markdown = File.read(File.expand_path('app/views/pages/' + file))
    headers = parse_markdown_headers(markdown)
    @title = headers['title']
    @about = renderer.render(strip_header(markdown)).html_safe
  end
end
