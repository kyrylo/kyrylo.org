require 'spec_helper'

describe "layouts/application" do
  before do
    view.stub('current_page?'.to_sym) { |opts| url_for(opts) == root_path }
    render
  end

  it "has a linkless logotype" do
    assert_select 'header>img'
    assert_select 'header>a>img', count: 0
  end

  it "has a menu entry with the link" do
    assert_select 'nav>ul>li>a', text: 'Projects'
  end
end
