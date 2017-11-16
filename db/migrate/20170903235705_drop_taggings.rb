class DropTaggings < ActiveRecord::Migration[4.2]
  def change
    drop_table 'taggings', force: :cascade do |t|
      t.integer  'tag_id'
      t.integer  'taggable_id'
      t.string   'taggable_type'
      t.integer  'tagger_id'
      t.string   'tagger_type'
      t.string   'context', limit: 128
      t.datetime 'created_at'
    end
  end
end
