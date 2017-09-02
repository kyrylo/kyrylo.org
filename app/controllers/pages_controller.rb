class PagesController < ApplicationController
  def home
    posts = grouped_timeline_records

    grouped_timeline_records.each do |year, post|
      posts[year] = post.group_by do |p|
        if p.is_a?(Trip)
          'trip'
        else
          'article'
        end
      end
    end

    @grouped_posts = Array(posts).sort.reverse
    @trips = Trip.all.sort_by(&:when_end).reverse
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

  def timeline_records
    Post.all
  end

  def sorted_timeline_records
    timeline_records.sort_by do |record|
      if record.is_a?(Trip)
        record.when_start
      else
        record.created_at
      end
    end
  end

  def grouped_timeline_records
    sorted_timeline_records.group_by do |record|
      if record.is_a?(Trip)
        record.when_start.year
      else
        record.created_at.year
      end
    end
  end
end
