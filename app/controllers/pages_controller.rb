class PagesController < ApplicationController

  def home
    records = (Post.all + Trip.all).sort_by do |record|
      if record.is_a?(Trip)
        record.when_start
      else
        record.created_at
      end
    end

    posts = records.group_by do |record|
      if record.is_a?(Trip)
        record.when_start.year
      else
        record.created_at.year
      end
    end

    posts.each do |year, post|
      posts[year] = post.group_by do |p|
        if p.is_a?(Trip)
          'trip'
        else
          p.type
        end
      end
    end

    @grouped_posts = Array(posts).sort.reverse
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
