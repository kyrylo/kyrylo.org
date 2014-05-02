require 'spec_helper'

describe "projects/show" do

  let(:project) { create(:project) }
  let(:project_finished) { create(:project_finished) }

  before do
    assign(:project, project)
    render
  end


  describe "state" do
    context "incomplete project" do
      let(:project_incomplete) { create(:project_incomplete) }

      before do
        assign(:project, project_incomplete)
        render
      end

      it "displays state" do
        expect(rendered).to have_selector('.info .state', text: 'incomplete')
      end
    end

    context "finished project" do
      it "doesn't display state" do
        expect(rendered)
          .to_not have_selector('.info .state', text: 'incomplete')
      end
    end
  end

  it "displays title" do
    expect(rendered).to have_selector('.info h1', text: project.title)
  end

end
