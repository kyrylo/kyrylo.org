class AddFaviconToProjectUrls < ActiveRecord::Migration[4.2]
  def self.up
    add_attachment :project_urls, :favicon
  end

  def self.down
    remove_attachment :project_urls, :favicon
  end
end
