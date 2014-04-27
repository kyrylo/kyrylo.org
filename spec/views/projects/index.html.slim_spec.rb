require 'spec_helper'

describe "projects/index" do
  let(:projects) {
    projects = 4.times.map { create(:project) }
    projects_with_thumbnails = 3.times.map { create(:project_with_thumbnail) }
    (projects + projects_with_thumbnails).shuffle
  }

  before do
    assign(:projects, projects)
    assign(:projects_count, 7)
    render
  end

  it "has a title" do
    expect(rendered).to have_selector('h1', text: 'Projects')
  end

  it "has the projects counter" do
    expect(rendered).to have_selector('.projects-meta .quantity div', text: '7')
  end

  it "renders a list of projects" do
    expect(rendered).to have_selector('.thumbnail', count: 7)
  end

  it "represents thumbnails in rows with 4 elements" do
    expect(rendered).to have_selector('.row', count: 2)
  end

  it "builds the project's thumbnail as an image" do
    expect(rendered).to have_selector('.thumbimg img', count: 3)
  end

  it "builds the project's thumbnail as text" do
    expect(rendered).to have_selector('.thumbimg .pseudoimg', count: 4)
  end
end
