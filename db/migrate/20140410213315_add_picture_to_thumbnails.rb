class AddPictureToThumbnails < ActiveRecord::Migration
  def self.up
    add_attachment :thumbnails, :picture
  end

  def self.down
    remove_attachment :thumbnails, :picture
  end
end
