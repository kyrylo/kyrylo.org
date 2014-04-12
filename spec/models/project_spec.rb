require 'spec_helper'

describe Project do
  it "is invalid without title" do
    expect(FactoryGirl.build(:project, title: nil)).to be_invalid
  end

  it "is invalid without headline" do
    expect(FactoryGirl.build(:project, headline: nil)).to be_invalid
  end

  it "is invalid without description" do
    expect(FactoryGirl.build(:project, description: nil)).to be_invalid
  end

  describe "#thumbnail" do
    context "with thumbnail" do
      it "returns the thumbnail" do
        project = FactoryGirl.build(:project_with_thumbnail)
        expect(project.thumbnail).to be_a Thumbnail
      end
    end

    context "without thumbnail" do
      it "returns nil" do
        expect(FactoryGirl.build(:project).thumbnail).to be_nil
      end
    end
  end
end
