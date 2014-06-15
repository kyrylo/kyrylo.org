require 'spec_helper'

describe "projects/_state" do

  before { assign(:project, project) && render }

  context "incomplete project" do
    let(:project) { build(:incomplete_project) }

    it "displays state" do
      expect(rendered).to have_selector('.state', text: 'incomplete')
    end
  end

  context "finished project" do
    let(:project) { build(:project) }

    it "doesn't display state" do
      expect(rendered).to_not have_selector('.state', text: 'incomplete')
    end
  end

end
