class AddFirstReleaseDateToProject < ActiveRecord::Migration[4.2]
  def change
    add_column :projects, :first_release_date, :date
  end
end
