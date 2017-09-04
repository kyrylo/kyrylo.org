class DropProjects < ActiveRecord::Migration
  def change
    remove_index 'projects', :slug

    drop_table 'projects', force: :cascade do |t|
      t.date     'release_date'
      t.boolean  'released', default: true
      t.text     'title'
      t.text     'html'
      t.text     'markdown'
      t.text     'slug'
      t.text     'description'
      t.datetime 'created_at', null: false
      t.datetime 'updated_at', null: false
    end
  end
end
