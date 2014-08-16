class DropRubbishTables < ActiveRecord::Migration
  def up
    drop_table :acknowledgements
    drop_table :assistants
    drop_table :implementations
    drop_table :licences
    drop_table :project_urls
    drop_table :projects
    drop_table :subordinations
    drop_table :technologies
    drop_table :third_parties
    drop_table :thumbnails
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
