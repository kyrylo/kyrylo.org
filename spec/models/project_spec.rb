require 'spec_helper'

describe Project do

  describe "associations" do
    it { should have_one :thumbnail }
    it { should have_many :acknowledgements }
    it { should belong_to :project_status }
  end

  describe "validations" do
    it { should validate_presence_of :title }
    it { should validate_presence_of :headline }
    it { should validate_presence_of :description }
  end

  describe "callbacks" do
    before do
      create(:project_status_finished)
      create(:project_status_incomplete)
    end

    describe ".before_save" do
      it "sets the project to 'finished' by default" do
        expect(create(:project).project_status.status).to eq(0)
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
