class ProjectsController < ApplicationController
  before_action :set_project, only: [:show]

  def index
    @projects = Project.all
    @projects_count = @projects.count
  end

  def show
  end

  private

  def set_project
    @project = Project.find(params[:id]).decorate
  end
end
