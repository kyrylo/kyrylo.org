class CreateThumbnails < ActiveRecord::Migration
  def change
    create_table :thumbnails, comment: 'Every project has 1 thumbnail ' \
      'that is shown on the index page' do |t|
      t.belongs_to :project, index: true
      t.text :dimensions, null: false

      t.timestamps
    end
  end
end
