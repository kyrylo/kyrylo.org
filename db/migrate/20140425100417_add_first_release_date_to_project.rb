class AddFirstReleaseDateToProject < ActiveRecord::Migration
  def change
    add_column :projects, :first_release_date, :date
  end
end
