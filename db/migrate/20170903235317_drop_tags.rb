class DropTags < ActiveRecord::Migration
  def change
    remove_index 'tags', :name

    drop_table 'tags', force: :cascade do |t|
      t.string  'name'
      t.integer 'taggings_count', default: 0
    end
  end
end
