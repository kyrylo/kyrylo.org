class CreateSubordinations < ActiveRecord::Migration
  def change
    create_table :subordinations do |t|
      t.references :project, index: true
      t.references :third_party, index: true

      t.timestamps
    end
  end
end
