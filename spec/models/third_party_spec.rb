require 'spec_helper'

describe ThirdParty do
  it "is invalid without a name" do
    expect(FactoryGirl.build(:third_party, name: nil)).to be_invalid
  end

  it "is valid without a link" do
    expect(FactoryGirl.build(:third_party, link: nil)).to be_valid
  end
end
