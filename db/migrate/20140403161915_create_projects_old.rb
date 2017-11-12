class CreateProjectsOld < ActiveRecord::Migration[4.2]
  def change
    create_table :projects do |t|
      t.text :title, null: false
      t.text :headline, comment: 'Displayed on the index page'
      t.text :description, null: false

      t.timestamps
    end
  end
end
