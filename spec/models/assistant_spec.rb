require 'spec_helper'

describe Assistant do
  describe "associations" do
    it { should have_many(:acknowledgements) }
  end

  describe "validations" do
    it { should validate_presence_of :full_name }
    it { should_not validate_presence_of :nick }
    it { should_not validate_presence_of :personal_page }
  end
end
