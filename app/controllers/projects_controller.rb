class ProjectsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_project, only: [:show, :edit, :update, :destroy]

  def index
    @projects = Project.all.sort_by(&:release_date).reverse
    @title = 'Projects'
  end

  def show
  end

  def new
    @project = Project.new
  end

  def edit
  end

  def create
    @project = Project.new(project_params)
    @project.html = renderer.render(project_params['markdown'])

    respond_to do |format|
      if @project.save
        format.html { redirect_to @project }
      else
        format.html { render action: 'new' }
      end
    end
  end

  def update
    respond_to do |format|
      if @project.update(project_params)
        format.html { redirect_to @project }
      else
        format.html { render action: 'edit' }
      end
    end
  end

  def destroy
    @project.destroy
    respond_to do |format|
      format.html { redirect_to projects_url }
    end
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:released,
                                    :release_date,
                                    :title,
                                    :markdown,
                                    :description,
                                    project_links_attributes: [:id, :name, :href])
  end
end
