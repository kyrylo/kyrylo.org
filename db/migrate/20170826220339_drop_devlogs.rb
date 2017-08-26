class DropDevlogs < ActiveRecord::Migration
  def change
    drop_table :devlogs do |t|
      t.integer  'project_id'
      t.datetime 'created_at', null: false
      t.datetime 'updated_at', null: false
    end
  end
end
