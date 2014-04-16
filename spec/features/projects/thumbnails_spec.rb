require 'spec_helper'

describe "projects/thumbnails", js: true do
  self.use_transactional_fixtures = false

  let(:classname) { '.thumbnail' }
  let(:highlighted) { '.title a' }

  after do
    Project.destroy_all
  end

  describe "hovering" do
    context "thumbnail as an image" do
      before do
        FactoryGirl.create(:project_with_thumbnail)
        visit projects_path
        @thumb_elem = find(classname)
      end

      it "makes the appropriate link highlight" do
        expect(@thumb_elem.find(highlighted)['class']).to eq(nil)
        @thumb_elem.find('.thumbimg a').hover
        expect(@thumb_elem.find(highlighted)['class']).to eq('hovered')
      end
    end

    context "thumbnail as text" do
      before do
        FactoryGirl.create(:project)
        visit projects_path
        @thumb_elem = find(classname)
      end

      it "makes the appropriate link highlight" do
        expect(@thumb_elem.find(highlighted)['class']).to eq(nil)
        @thumb_elem.find('.thumbimg a').hover
        expect(@thumb_elem.find(highlighted)['class']).to eq('hovered')
      end
    end
  end
end
