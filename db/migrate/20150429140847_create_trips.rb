class CreateTrips < ActiveRecord::Migration[4.2]
  def up
    create_table :trips do |t|
      t.text :where
      t.text :title
      t.datetime :when_start
      t.datetime :when_end
      t.text :html
      t.text :markdown
      t.text :slug, unique: true

      t.timestamps null: false
    end

    add_attachment :trips, :thumb
  end

  def down
    Trip.all.each do |trip|
      p = Post.new

      p.title = trip.title
      p.html = trip.html
      p.markdown = trip.markdown
      p.tag_list.add('trip')
      p.created_at = trip.when_start

      p.save!
      trip.destroy!
    end

    remove_attachment :trips, :thumb
    drop_table :trips
  end
end
