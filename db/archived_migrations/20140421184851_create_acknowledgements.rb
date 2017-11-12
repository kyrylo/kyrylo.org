class CreateAcknowledgements < ActiveRecord::Migration[4.2]
  def change
    create_table :acknowledgements do |t|
      t.text :text
      t.references :assistant, index: true, null: false
      t.references :project, index: true, null: false

      t.timestamps
    end
  end
end
