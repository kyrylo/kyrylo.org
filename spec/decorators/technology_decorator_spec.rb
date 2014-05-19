require 'spec_helper'

describe TechnologyDecorator do

  subject { described_class.new(technology) }

  describe "#technology_link" do
    context "the technology has the link" do
      let(:technology) { build(:technology_with_link, name: 'Techno') }

      it "links to the technology" do
        expect(subject.technology_link)
          .to eq("<a href=\"#{technology.link}\">Techno</a>")
      end
    end

    context "the technology doesn't have the link" do
      let(:technology) { build(:technology, name: 'Tststs') }

      it "doesn't create a link (just displays the name)" do
        expect(subject.technology_link).to eq('Tststs')
      end
    end
  end

end
