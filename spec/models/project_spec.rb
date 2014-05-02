require 'spec_helper'

describe Project do

  describe "associations" do
    it { should have_one :thumbnail }
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
        expect(build(:project_incomplete).tap(&:finish).finished?).to be_truthy
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

end
