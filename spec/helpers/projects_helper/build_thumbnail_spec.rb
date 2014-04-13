require 'spec_helper'

describe ProjectsHelper do
  describe "#build_thumbnail" do
    let(:project) { FactoryGirl.build(:project) }
    let(:project_with_thumbnail) { FactoryGirl.build(:project_with_thumbnail) }

    context "project has the thumbnail" do
      let(:title) { project_with_thumbnail.title }
      let(:thumbnail_with_pic_html) {
        "<a href=\".+\"><img alt=\"#{ title }\" height=\"92\" " +
        "src=\".+\" title=\"#{ title } home page\" width=\"100\" /></a>"
      }

      it "builds the thumbnail with the picture" do
        expect(build_thumbnail(project_with_thumbnail).to_s)
          .to match(thumbnail_with_pic_html)
      end
    end

    context "doesn't have the thumbnail" do
      let(:title) { project_with_thumbnail.title }

      it "mimics the title as the thumbnail picture" do
        expect(build_thumbnail(project).to_s)
          .to match("<a class=\"pseudoimg\" href=\".+\">#{ project.title }</a>")
      end
    end
  end
end
