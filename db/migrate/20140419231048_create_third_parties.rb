class CreateThirdParties < ActiveRecord::Migration
  def change
    create_table :third_parties do |t|
      t.text :name
      t.text :link

      t.timestamps
    end
  end
end
