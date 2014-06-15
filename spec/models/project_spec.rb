require 'spec_helper'

describe Project do

  describe "associations" do
    it { should have_one :thumbnail }
    it { should have_one :project_url }
    it { should have_many :acknowledgements }
    it { should have_many :implementations }
    it { should have_many(:technologies).through(:implementations) }
    it { should have_many :subordinations }
    it { should have_many(:third_parties).through(:subordinations) }
    it { should belong_to :licence }
  end

  describe "validations" do
    it { should validate_presence_of :title }
    it { should validate_presence_of :headline }
    it { should validate_presence_of :description }
    it { should validate_presence_of :first_release_date }
  end

  describe "states" do
    describe "initial" do
      it "equals to 'finished' by default" do
        expect(build(:project).finished?).to be_truthy
      end
    end

    describe "finished" do
      it "transits to 'incomplete'" do
        expect(build(:project).tap(&:mark_as_incomplete).incomplete?)
          .to be_truthy
      end
    end

    describe "incomplete" do
      it "transits to 'finished'" do
        expect(build(:incomplete_project).tap(&:finish).finished?).to be_truthy
      end
    end
  end

  describe "#thumbnail" do
    it "returns the thumbnail if it exists" do
      expect(build(:project_with_thumbnail).thumbnail).to be_a Thumbnail
    end

    it "returns nil if it doesn't exist" do
      expect(build(:project).thumbnail).to be_nil
    end
  end

  describe "#any_third_parties?" do
    it "returns true if the project has third parties" do
      expect(create(:subordination_with_third_party).project
          .any_third_parties?).to be_truthy
    end

    it "returns false if the project doesn't have third parties" do
      expect(create(:subordination).project.any_third_parties?).to be_falsey
    end
  end

  describe "#any_acknowledgements?" do
    it "returns true if the project has acknowledgements" do
      expect(create(:project_with_acknowledgements)
          .any_acknowledgements?).to be_truthy
    end

    it "returns false if the project doesn't have acknowledgements" do
      expect(create(:project).any_acknowledgements?).to be_falsey
    end
  end
end
