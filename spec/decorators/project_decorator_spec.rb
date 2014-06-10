require 'spec_helper'

describe ProjectDecorator do

  subject { described_class.new(project)}

  describe "#first_release_date" do
    let(:project) { build(:project, first_release_date: Date.new(2001, 2, 3)) }

    it "builds the first release date block" do
      expect(subject.first_release_date)
        .to eq("<div class=\"info-block\"><h4>First release date</h4>February 3, 2001</div>")
    end
  end

  describe "#licence" do
    let(:project) { build(:project, licence: build(:licence, name: 'Fake')) }

    it "builds the licence block" do
      expect(subject.licence)
        .to eq("<div class=\"info-block\"><h4>Licence</h4>Fake</div>")
    end
  end

  describe "#technologies" do
    let(:project) {
      create(
        :project,
        technologies: [
          create(:technology, name: 'Tech'),
          create(:technology_with_link, name: 'TechTech')
        ]
      )
    }

    it "builds the technologies block" do
      expect(subject.technologies)
        .to match("<div class=\"info-block\"><h4>Technologies</h4>Tech, <a href=\".+\">TechTech</a></div>")
    end
  end

  describe "#third_parties" do
    let(:project) {
      create(
        :project,
        third_parties: [
          create(:third_party, name: 'TP1'),
          create(:third_party, name: 'TP2')
        ]
      )
    }

    it "builds the third parties block" do
      expect(subject.third_parties)
        .to eq('<div class="info-block"><h4>Third party software</h4>TP1, TP2</div>')
    end
  end

  describe "#acknowledgements" do
    let(:project) {
      create(
        :project,
        acknowledgements: [
          create(:acknowledgement,
            assistant: create(:assistant, full_name: 'Joe')),
          create(:acknowledgement,
            assistant: create(:assistant, full_name: 'Bill')),
        ]
      )
    }

    it "builds the acknowledgements block" do
      expect(subject.acknowledgements)
        .to match(%r{<div class="info-block" id="acknowledgements"><h4>Acknowledgements</h4><span class="assistant"><span class="full-name " title="">(Joe|Bill)</span></span><br /><span class="assistant"><span class="full-name " title="">(Joe|Bill)</span></span></div>})
    end
  end

  describe "#address" do
    let(:project) { build(:project_with_favicon) }
    let(:website) { project.project_url.address }

    it "displays the project url along with the favicon" do
      expect(subject.address)
        .to match(%r{<a href="http://#{website}"><span class="favicon"><img alt=".+" src=".+" /></span><span class="url">#{website}</span></a>})
    end
  end
end
