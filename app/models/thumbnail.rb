class Thumbnail < ActiveRecord::Base
  belongs_to :project

  has_attached_file :picture, styles: { normal: '226x120' }
  validates_attachment_content_type :picture, content_type: /\Aimage\/.*\z/

  before_save :assign_dimensions
  serialize :dimensions

  private

  # Extracts the thumbnail's dimensions and stores them into the database.
  # @return [void]
  def assign_dimensions
    if (tempfile = picture.queued_for_write[:original])
      geometry = Paperclip::Geometry.from_file(tempfile)
      self.dimensions = [geometry.width.to_i, geometry.height.to_i]
    end
  end
end
