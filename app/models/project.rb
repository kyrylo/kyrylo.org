class Project < ActiveRecord::Base
  has_one :thumbnail

  validates :title, presence: true
  validates :headline, presence: true
  validates :description, presence: true
end
