require 'spec_helper'

describe "projects/show" do

  let(:project) { create(:project) }
  let(:project_finished) { create(:project_finished) }

  before do
    assign(:project, project)
    render
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

  it "displays the project's title" do
    expect(rendered).to have_selector('.info h1', text: project.title)
  end

end
