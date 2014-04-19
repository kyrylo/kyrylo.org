class CreateTechnologies < ActiveRecord::Migration
  def change
    create_table :technologies do |t|
      t.text :name, null: false
      t.text :link

      t.timestamps
    end
  end
end
