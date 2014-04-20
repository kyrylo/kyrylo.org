require 'spec_helper'

describe Assistant do
  it "is invalid without a full name" do
    expect(FactoryGirl.build(:assistant, full_name: nil)).to be_invalid
  end

  it "is valid without a nick" do
    expect(FactoryGirl.build(:assistant, nick: nil)).to be_valid
  end

  it "is valid without a personal page" do
    expect(FactoryGirl.build(:assistant, personal_page: nil)).to be_valid
  end
end
