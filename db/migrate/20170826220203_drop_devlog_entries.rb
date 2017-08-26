class DropDevlogEntries < ActiveRecord::Migration
  def change
    drop_table :devlog_entries do |t|
      t.integer  'devlog_id'
      t.text     'title'
      t.text     'html'
      t.text     'markdown'
      t.datetime 'created_at', null: false
      t.datetime 'updated_at', null: false
    end
  end
end
