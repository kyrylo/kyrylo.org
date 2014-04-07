require 'spec_helper'

describe "layouts/application" do
  it "creates a menu entry with the link" do
    render
    assert_select 'nav>ul>li>a', text: 'Projects'
  end
end
