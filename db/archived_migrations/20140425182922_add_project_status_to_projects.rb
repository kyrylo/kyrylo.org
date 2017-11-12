class AddProjectStatusToProjects < ActiveRecord::Migration[4.2]
  def change
    add_reference :projects, :project_status, index: true
  end
end
