class CreateTrips < ActiveRecord::Migration
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

    Post.tagged_with('trip').each do |post|
      t = Trip.new

      t.where = post.title
      t.title = post.title
      t.when_start = post.created_at
      t.when_end = post.created_at
      t.html = post.html
      t.markdown = post.markdown

      t.save!
      post.destroy!
    end
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
