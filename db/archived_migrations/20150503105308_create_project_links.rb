class CreateProjectLinks < ActiveRecord::Migration[4.2]
  def change
    create_table :project_links do |t|
      t.text :name
      t.text :href
      t.belongs_to :project, index: true

      t.timestamps null: false
    end
  end
end
