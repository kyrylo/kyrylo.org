class CreateDevlogEntries < ActiveRecord::Migration[4.2]
  def change
    create_table :devlog_entries do |t|
      t.belongs_to :devlog, index: true, foreign_key: true
      t.text :title
      t.text :html
      t.text :markdown

      t.timestamps null: false
    end
  end
end
