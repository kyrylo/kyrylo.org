class Trip < ActiveRecord::Base
  extend FriendlyId
  friendly_id :title, use: %i[slugged history finders]
  has_attached_file :thumb, styles: { thumb: '200x150#' }
  validates_attachment_content_type :thumb, content_type: /\Aimage\/.*\z/
end
