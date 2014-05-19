require 'spec_helper'

describe ThirdPartyDecorator do

  subject { described_class.new(third_party) }

  describe "#third_party_link" do
    context "the third party has the link" do
      let(:third_party) { build(:third_party_with_link, name: 'Ruby') }

      it "links to the third_party" do
        expect(subject.third_party_link)
          .to eq("<a href=\"#{third_party.link}\">TP1</a>")
      end
    end

    context "the third party doesn't have the link" do
      let(:third_party) { build(:third_party, name: 'OCaml') }

      it "doesn't create a link (just displays the name)" do
        expect(subject.third_party_link).to eq('OCaml')
      end
    end
  end

end
