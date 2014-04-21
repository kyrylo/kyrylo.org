class Assistant < ActiveRecord::Base
  has_many :acknowledgements
  validates :full_name, presence: true
end
