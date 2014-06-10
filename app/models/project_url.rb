class ProjectUrl < ActiveRecord::Base
  belongs_to :project

  has_attached_file :favicon, default_url: 'favicon-missing.png'
  validates_attachment_content_type :favicon, content_type: /\Aimage\/png\z/
end
