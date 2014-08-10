class AddSlugToPosts < ActiveRecord::Migration
  def change
    add_column :posts, :slug, :text
    add_index :posts, :slug
  end
end
