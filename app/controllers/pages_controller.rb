class PagesController < ApplicationController
  def home
    @posts = Post.all.order(created_at: :desc)
    @trips = Trip.all.order(when_end: :desc)
  end

  def cv
    @title = 'Curriculum Vitae'
  end
end
