class CreateProjectStatuses < ActiveRecord::Migration
  def change
    create_table :project_statuses do |t|
      t.integer :status, default: 0, null: false
      t.text :explanation

      t.timestamps
    end
  end
end
