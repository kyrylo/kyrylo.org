class Trip < ActiveRecord::Base
  extend FriendlyId
  friendly_id :title, use: %i[slugged history finders]
  has_attached_file :thumb,
                    storage: :imgur,
                    styles: { thumb: '200x150#' },
                    default_url: '/images/missing.png'
  validates_attachment_content_type :thumb, content_type: /\Aimage\/.*\z/
end
