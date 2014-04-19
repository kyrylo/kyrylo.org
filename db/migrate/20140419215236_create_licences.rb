class CreateLicences < ActiveRecord::Migration
  def change
    create_table :licences do |t|
      t.text :name, null: false
      t.text :link

      t.timestamps
    end
  end
end
