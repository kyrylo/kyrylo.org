class CreatePosts < ActiveRecord::Migration[4.2]
  def change
    create_table :posts do |t|
      t.text :markdown
      t.text :html
      t.text :title
      t.timestamps
    end
  end
end
