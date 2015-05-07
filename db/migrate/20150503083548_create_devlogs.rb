class CreateDevlogs < ActiveRecord::Migration
  def change
    create_table :devlogs do |t|
      t.belongs_to :project, index: true

      t.timestamps null: false
    end
  end
end
