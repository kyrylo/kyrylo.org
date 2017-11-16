class AddSlugToPosts < ActiveRecord::Migration[4.2]
  def change
    add_column :posts, :slug, :text
    add_index :posts, :slug
  end
end
