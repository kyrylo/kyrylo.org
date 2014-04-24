require 'spec_helper'

describe ThirdParty do
  describe "validations" do
    it { should validate_presence_of :name }
    it { should_not validate_presence_of :link }
  end
end
