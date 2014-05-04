require 'spec_helper'

describe Assistant do
  describe "associations" do
    it { should have_many(:acknowledgements) }
  end

  describe "validations" do
    it { should validate_presence_of :full_name }

    describe ":nick" do
      it { should_not validate_presence_of :nick }
      it { should allow_value('qwerty').for(:nick) }
      it { should_not allow_value('').for(:nick) }
      it { should allow_value(nil).for(:nick) }
    end

    describe ":personal_page" do
      it { should_not validate_presence_of :personal_page }
      it { should allow_value('qwerty').for(:personal_page) }
      it { should_not allow_value('').for(:personal_page) }
      it { should allow_value(nil).for(:personal_page) }
    end
  end
end
