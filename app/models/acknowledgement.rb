class Acknowledgement < ActiveRecord::Base
  belongs_to :assistant
  belongs_to :project
end
