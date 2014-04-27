class ProjectsController < ApplicationController
  before_action :set_project, only: [:show]

  def index
    @projects = Project.all
    @projects_count = @projects.count
  end

  def show
    @project_status = @project.project_status
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end
end
