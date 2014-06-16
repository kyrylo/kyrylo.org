require 'rails_helper'

describe Subordination do

  describe "associations" do
    it { should belong_to :project }
    it { should belong_to :third_party }
  end

end
