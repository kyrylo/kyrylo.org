require 'spec_helper'

describe Licence do
  it "is invalid without a name" do
    expect(FactoryGirl.build(:licence, name: nil)).to be_invalid
  end

  it "is valid without a link" do
    expect(FactoryGirl.build(:licence, link: nil)).to be_valid
  end
end
