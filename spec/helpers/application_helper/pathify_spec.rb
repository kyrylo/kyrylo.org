require 'spec_helper'

describe ApplicationHelper do
  describe "#pathify" do
    let(:menu_item) { 'Projects' }

    it "converts a menu_item to the path" do
      expect(pathify(menu_item)).to eq('/projects')
    end
  end
end
