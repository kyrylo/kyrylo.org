require 'spec_helper'

describe ProjectUrl do
  describe "associations" do
    it { should belong_to :project }
  end

  describe "validations" do
    it {
      should validate_attachment_content_type(:favicon)
        .allowing('image/png')
        .rejecting('image/gif', 'image/jpeg', 'image/x-icon')
    }
  end
end
