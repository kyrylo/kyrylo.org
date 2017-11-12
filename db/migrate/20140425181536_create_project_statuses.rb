class CreateProjectStatuses < ActiveRecord::Migration[4.2]
  def change
    create_table :project_statuses do |t|
      t.integer :status, default: 0, null: false
      t.text :explanation

      t.timestamps
    end
  end
end
