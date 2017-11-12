class CreateThirdParties < ActiveRecord::Migration[4.2]
  def change
    create_table :third_parties do |t|
      t.text :name, null: false
      t.text :link

      t.timestamps
    end
  end
end
