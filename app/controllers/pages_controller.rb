class PagesController < ApplicationController
  def home
    posts = grouped_timeline_records

    grouped_timeline_records.each do |year, post|
      posts[year] = post.group_by do |p|
        if p.is_a?(Trip)
          'trip'
        elsif p.is_a?(Project)
          'project'
        else
          p.type
        end
      end
    end

    @grouped_posts = Array(posts).sort.reverse
    @projects = Project::PROJECT_LIST.sort_by { |k, v| v[:date] }
  end

  def about
    render_markdown('about.md')
  end

  def cv
    @title = 'Curriculum Vitae'

    cv_path = Rails.root + 'public/cv.pdf'
    raw_pdf_size = File.size(cv_path).to_f / 2**20
    @pdf_size = '(%.2f MiB)' % raw_pdf_size

    mp3_path = Rails.root + 'public/kyrylo.mp3'
    raw_mp3_size = File.size(mp3_path).to_f / 2**20
    @mp3_size = '(%.3f MiB)' % raw_mp3_size
  end

  private

  def render_markdown(file)
    markdown = File.read(File.expand_path('app/views/pages/' + file))
    headers = parse_markdown_headers(markdown)
    @title = headers['title']
    @about = renderer.render(strip_header(markdown)).html_safe
  end

  def timeline_records
    Post.all + Trip.all + Project.all
  end

  def sorted_timeline_records
    timeline_records.sort_by do |record|
      if record.is_a?(Trip)
        record.when_start
      elsif record.is_a?(Project)
        record.release_date
      else
        record.created_at
      end
    end
  end

  def grouped_timeline_records
    sorted_timeline_records.group_by do |record|
      if record.is_a?(Trip)
        record.when_start.year
      elsif record.is_a?(Project)
        record.release_date.year
      else
        record.created_at.year
      end
    end
  end
end
