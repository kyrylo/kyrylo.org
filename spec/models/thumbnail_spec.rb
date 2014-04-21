require 'spec_helper'

describe Thumbnail do
  describe "associations" do
    it { should belong_to :project }
  end

  describe "validations" do
    it { should validate_attachment_presence :picture }
  end

  describe "attachments" do
    it { should have_attached_file :picture }
    it {
      should validate_attachment_content_type(:picture).allowing(
        'image/png', 'image/gif').rejecting('text/plain', 'text/xml')
    }
  end

  describe "#dimensions" do
    let(:thumb) { create(:thumbnail_with_picture) }

    it "returns the array of the picture's dimensions ([width, height])" do
      expect(thumb.dimensions).to match_array([100, 92])
    end
  end
end
