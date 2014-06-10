class CreateProjectUrls < ActiveRecord::Migration
  def change
    create_table :project_urls do |t|
      t.references :project, index: true
      t.text :address

      t.timestamps
    end
  end
end
