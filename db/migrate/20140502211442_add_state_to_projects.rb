class AddStateToProjects < ActiveRecord::Migration[4.2]
  def change
    add_column :projects, :state, :text
  end
end
