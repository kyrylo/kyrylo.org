require 'rails_helper'

describe "projects/thumbnails", js: true do
  self.use_transactional_fixtures = false

  let(:highlighted) { '.thumbnail .title a' }

  shared_examples "highlighting" do
    subject { visit projects_path; find(highlighted) }

    it "highlights the link" do
      expect(subject['class']).to be_nil
      find('.thumbimg a').hover
      expect(subject['class']).to eq('hovered')
    end
  end

  describe "hovering" do
    after { Project.destroy_all }

    context "thumbnail as an image" do
      before { create :project_with_thumbnail }
      include_examples "highlighting"
    end

    context "thumbnail as text" do
      before { create :project }
      include_examples "highlighting"
    end
  end
end
