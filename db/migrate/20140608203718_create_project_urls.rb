class CreateProjectUrls < ActiveRecord::Migration[4.2]
  def change
    create_table :project_urls do |t|
      t.references :project, index: true
      t.text :address

      t.timestamps
    end
  end
end
