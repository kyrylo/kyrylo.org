class CreateImplementations < ActiveRecord::Migration[4.2]
  def change
    create_table :implementations do |t|
      t.references :project, index: true
      t.references :technology, index: true

      t.timestamps
    end
  end
end
