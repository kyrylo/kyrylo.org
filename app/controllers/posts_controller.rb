class PostsController < ApplicationController
  before_action :authenticate_user!, except: %i[index show]
  before_action :set_post, only: %i[show edit update destroy]

  def index
    if params[:tag]
      @posts = Post.tagged_with(params[:tag].singularize)
    else
      @posts = Post.all
    end
    @posts = @posts.order('created_at DESC').page(params[:page]).per(10)
    @count = @posts.count
    @title = "All #{params[:tag]} - kyrylo.org"
  end

  def show
  end

  def new
    @post = Post.new
  end

  def edit
  end

  def create
    @post = Post.new(post_params)
    prepare_post(@post.markdown)

    respond_to do |format|
      if @post.save
        format.html { redirect_to @post }
      else
        format.html { render action: 'new' }
      end
    end
  end

  def update
    prepare_post(post_params[:markdown])
    @post.slug = nil

    respond_to do |format|
      if @post.save
        format.html { redirect_to @post }
      else
        format.html { render action: 'edit' }
      end
    end
  end

  def destroy
    @post.destroy
    respond_to do |format|
      format.html { redirect_to posts_url }
    end
  end

  private

  def prepare_post(markdown)
    headers = parse_markdown_headers(markdown)
    @post.html = renderer.render(strip_header(markdown))
    @post.title = headers['title']
    @post.tag_list = headers['tags']
    @post.created_at = Date.strptime(headers['publish_date'], '%d %b %Y') rescue Time.now
    @post.markdown = markdown
  end

  def set_post
    @post = Post.find(params[:id])
  end

  def post_params
    params.require(:post).permit(:markdown)
  end
end
