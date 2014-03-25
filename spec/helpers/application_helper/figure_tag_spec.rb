require 'spec_helper'

describe ApplicationHelper do
  describe "#figure_tag" do
    let(:source) { 'avatar.png' }
    let(:figcaption) { 'My Avatar' }

    it "creates a safe buffer with a figcaption" do
      expect(figure_tag(source, figcaption: figcaption).to_s)
        .to eq("<figure><img alt=\"Avatar\" src=\"/images/avatar.png\" /><figcaption>My Avatar</figcaption></figure>")
    end

    it "creates a safe buffer without a figcaption" do
      expect(figure_tag(source).to_s).
        to eq("<figure><img alt=\"Avatar\" src=\"/images/avatar.png\" /></figure>")
    end
  end
end
