class DevlogEntriesController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_devlog_entry, only: %i[show edit update destroy]
  before_action :set_project, only: %i[new create]

  def show
    @title = @devlog_entry.title

    @devlog = @devlog_entry.devlog
    @project = @devlog.project
    @note = @devlog_entry.id
    @date = iso_date(@devlog_entry.created_at)

    @prev, @next = find_pages
  end

  def new
    @devlog_entry = DevlogEntry.new(devlog: @project.devlog)
  end

  def edit
    @proejct = @devlog_entry.devlog.project
  end

  def create
    new_params = {devlog: @project.devlog}.merge(devlog_entry_params)
    @devlog_entry = DevlogEntry.new(new_params)
    @devlog_entry.html = renderer.render(new_params['markdown'])

    respond_to do |format|
      if @devlog_entry.save
        format.html do
          redirect_to devlog_entry_project_devlog_url(params[:project_id], @devlog_entry)
        end
      else
        format.html { render action: 'new' }
      end
    end
  end

  def update
    respond_to do |format|
      html = {html: renderer.render(devlog_entry_params['markdown'])}
      new_params = html.merge(devlog_entry_params)

      if @devlog_entry.update(new_params)
        format.html do
          project = @devlog_entry.devlog.project
          redirect_to devlog_entry_project_devlog_url(project, @devlog_entry)
        end
      else
        format.html { render action: 'edit' }
      end
    end
  end

  def destroy
    @devlog_entry.destroy
    respond_to do |format|
      format.html { redirect_to project_devlog_url(@devlog_entry.devlog.project) }
    end
  end

  private

  def find_pages
    neighbours = @devlog.devlog_entries

    idx = neighbours.ids.index(@devlog_entry.id)
    prev_idx, next_idx = idx.pred, idx.succ
    prev = neighbours[prev_idx] if prev_idx >= 0
    next_ = neighbours[next_idx]

    [prev, next_]
  end

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_devlog_entry
    @devlog_entry = DevlogEntry.find(params[:id])
  end

  def devlog_entry_params
    params.require(:devlog_entry).permit(:title, :markdown)
  end
end
