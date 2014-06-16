require 'rails_helper'

describe Technology do
  describe "validations" do
    it { should validate_presence_of :name }
    it { should_not validate_presence_of :link }
  end
end
