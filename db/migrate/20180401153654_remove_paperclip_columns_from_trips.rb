class RemovePaperclipColumnsFromTrips < ActiveRecord::Migration[5.1]
  def change
    remove_column :trips, :thumb_file_name, :string
    remove_column :trips, :thumb_content_type, :string
    remove_column :trips, :thumb_file_size, :integer
    remove_column :trips, :thumb_updated_at, :datetime
  end
end
