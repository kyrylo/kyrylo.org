require 'spec_helper'

describe TooltipPresenter do
  let(:view) { Draper::ViewContext.current }
  let(:text) { "Then he waddled away, waddle waddle, 'til the very next day" }

  describe "#to_html" do
    let(:assistant_with_pp) { build(:assistant_with_personal_page) }
    let(:assistant_without_pp) { build(:assistant) }
    let(:pp_match) { Regexp.new(assistant_with_pp.personal_page) }

    context "assistant has personal page" do
      subject { described_class.new(view, text, assistant_with_pp) }
      it "generates the link to the personal page" do
        expect(subject.to_html).to match(Regexp.new(pp_match))
        expect(subject.to_html).to match(/Visit personal page/)
      end
    end

    context "assistant doesn't have personal page" do
      subject { described_class.new(view, text, assistant_without_pp) }
      it "doesn't generate the link to the personal page" do
        expect(subject.to_html).not_to match(pp_match)
        expect(subject.to_html).not_to match(/Visit personal page/)
      end
    end
  end

  describe "#classname" do
    let(:assistant) { build(:assistant) }

    context "non-empty @text" do
      subject { described_class.new(view, text, assistant) }
      it "returns the class name" do
        expect(subject.classname).to match('tooltip')
      end
    end

    context "empty @text" do
      subject { described_class.new(view, '', assistant) }
      it "returns nil" do
        expect(subject.classname).to be_nil
      end
    end
  end

end
