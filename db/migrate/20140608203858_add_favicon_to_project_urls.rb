class AddFaviconToProjectUrls < ActiveRecord::Migration
  def self.up
    add_attachment :project_urls, :favicon
  end

  def self.down
    remove_attachment :project_urls, :favicon
  end
end
