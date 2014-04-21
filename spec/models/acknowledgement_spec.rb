require 'spec_helper'

describe Acknowledgement do
  describe "associations" do
    it { should belong_to(:project) }
    it { should belong_to(:assistant) }
  end
end
