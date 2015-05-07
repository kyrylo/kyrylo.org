class Project < ActiveRecord::Base
  extend FriendlyId
  friendly_id :title, use: [:slugged, :history, :finders]

  has_one :devlog
  has_many :project_links
  before_destroy { project_links.destroy_all if ProjectLink.table_exists? }
  accepts_nested_attributes_for(
    :project_links,
    reject_if: lambda {
      |attributes| attributes['href'].blank?
    }
  )
end
