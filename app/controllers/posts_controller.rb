class PostsController < ApplicationController
  before_action :authenticate_user!, except: %i[show]
  before_action :set_post, except: %i[new create]

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
      format.html { redirect_to root_url }
    end
  end

  private

  def prepare_post(markdown)
    headers = parse_markdown_headers(markdown)
    @post.html = renderer.render(strip_header(markdown))
    @post.title = headers['title']
    # rubocop:disable Lint/RescueWithoutErrorClass
    @post.created_at = Date.strptime(headers['publish_date'], '%d %b %Y') rescue Time.now
    # rubocop:enable Lint/RescueWithoutErrorClass
    @post.markdown = markdown
  end

  def set_post
    @post = Post.find(params[:id])
  end

  def post_params
    params.require(:post).permit(:markdown)
  end
end
