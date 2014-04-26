class AddProjectStatusToProjects < ActiveRecord::Migration
  def change
    add_reference :projects, :project_status, index: true
  end
end
