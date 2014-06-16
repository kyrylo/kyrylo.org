require 'rails_helper'

describe LicenceDecorator do

  subject { described_class.new(licence) }

  describe "#licence_link" do
    context "the licence has the link" do
      let(:licence) { build(:licence_with_link) }

      it "links to the licence" do
        expect(subject.licence_link)
          .to eq("<a href=\"#{licence.link}\">#{licence.name}</a>")
      end
    end

    context "the licence doesn't have the link" do
      let(:licence) { build(:licence) }

      it "doesn't create a link (just displays the name)" do
        expect(subject.licence_link).to eq(licence.name)
      end
    end
  end

end
