class DropProjectStatuses < ActiveRecord::Migration
  def up
    remove_column :projects, :project_status_id

    drop_table :project_statuses
  end

  def down
    fail ActiveRecord::IrreversibleMigration
  end
end
