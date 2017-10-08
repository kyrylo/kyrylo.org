module PostsHelper
  def posts_form_path
    return posts_path if @post.new_record?
    { controller: 'posts', action: 'update' }
  end
end
