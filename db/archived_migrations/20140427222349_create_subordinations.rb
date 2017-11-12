class CreateSubordinations < ActiveRecord::Migration[4.2]
  def change
    create_table :subordinations do |t|
      t.references :project, index: true
      t.references :third_party, index: true

      t.timestamps
    end
  end
end
