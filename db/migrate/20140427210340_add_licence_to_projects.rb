class AddLicenceToProjects < ActiveRecord::Migration
  def change
    add_reference :projects, :licence, index: true
  end
end
