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

  describe "info blocks" do
    let(:project) { create(:project_stuffed).decorate }

    shared_examples "block presence" do |text|
      it "is rendered" do
        expect(rendered).to have_selector('.info-block h4', text: text)
      end
    end

    shared_examples "block absence" do |text|
      let(:project) { build(:project).decorate }

      it "is rendered" do
        expect(rendered).not_to have_selector('.info-block h4', text: text)
      end
    end

    shared_examples "presence and absence" do |text|
      context "present" do
        include_examples 'block presence', text
      end

      context "absent" do
        include_examples 'block absence', text
      end
    end

    describe "first release date" do
      include_examples 'block presence', 'First release date'
    end

    describe "licence" do
      include_examples 'block presence', 'Licence'
    end

    describe "technologies" do
      include_examples 'block presence', 'Technologies'
    end

    describe "third party software" do
      include_examples 'presence and absence', 'Third party software'
    end

    describe "acknowledgements" do
      include_examples 'presence and absence', 'Acknowledgements'
    end
  end

  describe "project url" do
    context "project has the url" do
      def favicon(img)
        %r{<span class="favicon"><img alt=".+" src=".+\/#{img}.+" />}
      end

      let(:project) { build(:project_with_favicon).decorate }

      before { assign(:project, project) && render }

      context "with favicon" do
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

  it "displays the project's title" do
    expect(rendered).to have_selector('.info h1', text: project.title)
  end

end
