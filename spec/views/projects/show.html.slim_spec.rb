require 'spec_helper'

describe "projects/show" do

  let(:project_status) { create(:project_status_finished)}
  let(:project) { create(:project) }

  before do
    assign(:project_status, project_status)
    assign(:project, project)
    render
  end


  describe "status" do
    context "incomplete project" do
      let(:status_incomplete) { create(:project_status_incomplete) }

      before do
        project.project_status = status_incomplete
        assign(:project_status, status_incomplete)
        render
      end

      it "displays status" do
        expect(rendered).to have_selector('.info .status', text: 'incomplete')
      end
    end

    context "finished project" do
      it "doesn't display status" do
        expect(rendered)
          .to_not have_selector('.info .status', text: 'incomplete')
      end
    end
  end

  it "displays title" do
    expect(rendered).to have_selector('.info h1', text: project.title)
  end

end
