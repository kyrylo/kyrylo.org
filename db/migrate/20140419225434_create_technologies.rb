class CreateTechnologies < ActiveRecord::Migration[4.2]
  def change
    create_table :technologies do |t|
      t.text :name, null: false
      t.text :link

      t.timestamps
    end
  end
end
