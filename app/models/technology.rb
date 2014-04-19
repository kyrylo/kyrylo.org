class Technology < ActiveRecord::Base
  validates :name, presence: true
end
