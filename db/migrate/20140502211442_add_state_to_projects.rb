class AddStateToProjects < ActiveRecord::Migration
  def change
    add_column :projects, :state, :text
  end
end
