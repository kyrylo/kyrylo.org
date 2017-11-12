class AddPictureToThumbnails < ActiveRecord::Migration[4.2]
  def self.up
    add_attachment :thumbnails, :picture
  end

  def self.down
    remove_attachment :thumbnails, :picture
  end
end
