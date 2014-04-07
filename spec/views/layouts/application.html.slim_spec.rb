require 'spec_helper'

describe "layouts/application" do
  before do
    allow(view).to receive(:current_page?) { |opts| url_for(opts) == root_path }
    render
  end

  it "has a linkless logotype" do
    expect(rendered).to have_selector('header>img')
    expect(rendered).to have_selector('header>a>img', count: 0)
  end

  it "has a menu entry with the link" do
    expect(rendered).to have_selector('nav>ul>li>a', text: 'Projects')
  end
end
