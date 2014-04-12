require 'spec_helper'

describe Thumbnail do
  it "is valid without a picture" do
    expect(FactoryGirl.build(:thumbnail)).to be_invalid
  end

  it "is valid with a picture" do
    expect(FactoryGirl.build(:thumbnail_with_picture)).to be_valid
  end

  describe "#dimensions" do
    it "returns the array of the picture's dimensions ([width, height])" do
      thumb = FactoryGirl.create(:thumbnail_with_picture)
      expect(thumb.dimensions).to match_array([100, 92])
    end
  end
end
