class CreateDevlogs < ActiveRecord::Migration[4.2]
  def change
    create_table :devlogs do |t|
      t.belongs_to :project, index: true

      t.timestamps null: false
    end
  end
end
