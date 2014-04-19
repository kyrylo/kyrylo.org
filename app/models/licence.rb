class Licence < ActiveRecord::Base
  validates :name, presence: true
end
