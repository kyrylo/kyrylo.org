class DevlogsController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_project, only: [:launch]
  before_action :set_devlog, only: %i[show destroy]

  def show
    respond_to do |format|
      if @devlog
        format.html { render action: 'show' }
      else
        format.html { redirect_to @project }
      end
    end
  end

  def launch
    @devlog = Devlog.new(project: @project)

    respond_to do |format|
      if @devlog.save
        format.html { redirect_to project_devlog_url(@project) }
      else
        format.html { redirect_to @project }
      end
    end
  end

  def destroy
    @devlog.destroy
    respond_to do |format|
      format.html { redirect_to @devlog.project }
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
