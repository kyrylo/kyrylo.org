require 'rails_helper'

describe ApplicationHelper do
  describe "#figure_tag" do
    let(:source) { 'avatar.png' }
    let(:figcaption) { 'My Avatar' }
    let(:with_figcaption_html) {
      "<figure><img alt=\"Avatar\" src=\"/images/avatar.png\" />" +
        "<figcaption>My Avatar</figcaption></figure>"
    }
    let(:without_figcaption_html) {
      "<figure><img alt=\"Avatar\" src=\"/images/avatar.png\" /></figure>"
    }

    subject { figure_tag(source, figcaption: figcaption) }
    it "creates a safe buffer with a figcaption" do
      expect(subject.to_s).to eq(with_figcaption_html)
    end

    it "creates a safe buffer without a figcaption" do
      expect(figure_tag(source).to_s).to eq(without_figcaption_html)
    end
  end
end
