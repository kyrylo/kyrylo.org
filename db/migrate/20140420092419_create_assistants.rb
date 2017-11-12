class CreateAssistants < ActiveRecord::Migration[4.2]
  def change
    create_table :assistants do |t|
      t.text :full_name, null: false
      t.text :nick
      t.text :personal_page

      t.timestamps
    end
  end
end
