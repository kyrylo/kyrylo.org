class DropTaggings < ActiveRecord::Migration
  def change
    remove_index(
      'taggings',
      column: %i[tag_id taggable_id taggable_type context tagger_id tagger_type],
      name: 'index_taggings_on_taggable_id_and_taggable_type_and_context'
    )

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
