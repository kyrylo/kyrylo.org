class DevlogsController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_project, only: [:launch]
  before_action :set_devlog, only: [:show, :edit, :update, :destroy]

  def show
    respond_to do |format|
      if @devlog
        format.html { render action: 'show' }
      else
        format.html { redirect_to @project }
      end
    end
  end

  def edit
  end

  def launch
    @devlog = Devlog.new(project: @project)

    respond_to do |format|
      if @devlog.save
        format.html { redirect_to project_devlog_path(@project), notice: 'Devlog was successfully created.' }
      else
        format.html { redirect_to @project, notice: 'Failed' }
      end
    end
  end

  def update
    respond_to do |format|
      if @devlog.update(devlog_params)
        format.html { redirect_to project_devlog(@devlog), notice: 'Devlog was successfully updated.' }
      else
        format.html { render action: 'edit' }
      end
    end
  end

  def destroy
    @devlog.destroy
    respond_to do |format|
      format.html { redirect_to devlogs_url }
      format.json { head :no_content }
    end
  end

  private

  def set_devlog
    @project = set_project
    @devlog = @project.devlog
  end

  def set_project
    @project = Project.find(params[:project_id])
  end

  def devlog_params
    params.require(:devlog).permit(:markdown)
  end
end
