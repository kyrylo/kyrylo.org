class PagesController < ApplicationController
  def home
    @posts = Post.order('created_at ASC').all
  end
end
