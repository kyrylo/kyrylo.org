class Technology < ActiveRecord::Base
  has_many :implementations
  has_many :projects, through: :implementations

  validates :name, presence: true
end
