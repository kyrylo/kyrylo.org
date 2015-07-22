module PagesHelper
  def render_inner_tags(tag_list, title_tag)
    filtered_tags = tag_list.reject { |tag| tag == title_tag }
    render_tags(filtered_tags)
  end

  def fresh_post?(post)
    #require 'pry'; binding.pry
    diff = if post.is_a?(Trip)
             Time.diff(Time.now, post.when_start)
           elsif post.is_a?(Project)
             Time.diff(Time.now, post.release_date)
           else
             Time.diff(Time.now, post.created_at)
           end

    diff[:year] == 0 && diff[:month] <= 2
  end
end
