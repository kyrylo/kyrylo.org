class AddThumbUrlToTrips < ActiveRecord::Migration[5.1]
  def change
    add_column :trips, :thumb_url, :string
  end
end
