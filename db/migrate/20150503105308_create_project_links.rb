class CreateProjectLinks < ActiveRecord::Migration
  def change
    create_table :project_links do |t|
      t.text :name
      t.text :href
      t.belongs_to :project, index: true

      t.timestamps null: false
    end
  end
end
