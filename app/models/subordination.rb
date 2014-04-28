class Subordination < ActiveRecord::Base
  belongs_to :project
  belongs_to :third_party
end
