class DropProjectLinks < ActiveRecord::Migration[4.2]
  def change
    remove_index 'project_links', :project_id

    drop_table 'project_links', force: :cascade do |t|
      t.text     'name'
      t.text     'href'
      t.integer  'project_id'
      t.datetime 'created_at', null: false
      t.datetime 'updated_at', null: false
    end
  end
end
