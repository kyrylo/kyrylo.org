require 'rails_helper'

describe "projects/_url" do

  def favicon(img)
    %r{<span class="favicon"><img alt=".+" src=".+\/#{img}.*" />}
  end

  let(:project) { create(:project) }

  before { assign(:project, project) && render }

  context "project has the url" do
    context "with favicon" do
      let(:project) { build(:project_with_favicon).decorate }

      it "displays the custom favicon" do
        expect(rendered).to match(favicon('favicon\.png\?'))
      end
    end

    context "without favicon" do
      let(:project) { build(:project_without_favicon).decorate }

      it "displays the default favicon" do
        expect(rendered).to match(favicon('favicon-missing\.png'))
      end
    end

    let(:project) { build(:project_with_favicon).decorate }

    it "displays url" do
      expect(rendered).to have_selector('.reference .url')
    end
  end

  context "project doesn't have the url" do
    it "doesn't display the url" do
      expect(rendered).not_to have_selector('.reference .url')
    end
  end

end
