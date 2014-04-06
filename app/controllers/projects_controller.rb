class ProjectsController < ApplicationController
  def index
    @projects = Project.all
    @projects_count = @projects.count
  end
end
