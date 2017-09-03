module PagesHelper
  def fresh_post?(post)
    diff = if post.is_a?(Trip)
             Time.diff(Time.now, post.when_start)
           else
             Time.diff(Time.now, post.created_at)
           end

    diff[:year] == 0 && diff[:month] <= 2
  end
end
