class AddLicenceToProjects < ActiveRecord::Migration[4.2]
  def change
    add_reference :projects, :licence, index: true
  end
end
