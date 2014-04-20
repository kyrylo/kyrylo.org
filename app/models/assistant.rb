class Assistant < ActiveRecord::Base
  validates :full_name, presence: true
end
