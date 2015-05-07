class DevlogEntriesController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_devlog_entry, only: [:show, :edit, :update, :destroy]

  def show
    @devlog = @devlog_entry.devlog
    @project = @devlog.project
    @note = @devlog_entry.id

    neighbours = @devlog.devlog_entries

    idx = neighbours.ids.index(@devlog_entry.id)
    prev_idx, next_idx = idx.pred, idx.succ
    @prev = if prev_idx >= 0
              neighbours[prev_idx]
            end
    @next = neighbours[next_idx]
  end

  def new
    @devlog_entry = DevlogEntry.new(devlog: Project.find(params[:project_id]).devlog)
  end

  def edit
    @proejct = @devlog_entry.devlog.project
  end

  def create
    new_params = {devlog: Project.find(params[:project_id]).devlog}.merge(devlog_entry_params)
    @devlog_entry = DevlogEntry.new(new_params)
    @devlog_entry.html = renderer.render(new_params['markdown'])

    respond_to do |format|
      if @devlog_entry.save
        format.html { redirect_to devlog_entry_project_devlog_path(params[:project_id], @devlog_entry), notice: 'Devlog entry was successfully created.' }
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
        format.html { redirect_to devlog_entry_project_devlog_path(params[:project_id], @devlog_entry), notice: 'Devlog entry was successfully updated.' }
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

  def set_devlog_entry
    @devlog_entry = DevlogEntry.find(params[:id])
  end

  def devlog_entry_params
    params.require(:devlog_entry).permit(:title,
                                         :markdown)
  end
end
