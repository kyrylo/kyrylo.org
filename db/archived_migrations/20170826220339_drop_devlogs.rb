class DropDevlogs < ActiveRecord::Migration[4.2]
  def change
    drop_table :devlogs do |t|
      t.integer  'project_id'
      t.datetime 'created_at', null: false
      t.datetime 'updated_at', null: false
    end
  end
end
