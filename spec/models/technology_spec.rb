require 'spec_helper'

describe Technology do
  it "is invalid without a name" do
    expect(FactoryGirl.build(:technology, name: nil)).to be_invalid
  end

  it "is valid without a link" do
    expect(FactoryGirl.build(:technology, link: nil)).to be_valid
  end
end
