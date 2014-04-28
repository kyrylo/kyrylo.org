class ThirdParty < ActiveRecord::Base
  has_many :subordinations
  has_many :projects, through: :subordinations

  validates :name, presence: true
end
