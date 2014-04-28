require 'spec_helper'

describe Licence do

  describe "associations" do
    it { should have_many :projects }
  end

  describe "validations" do
    it { should validate_presence_of :name }
    it { should_not validate_presence_of :link }
  end

end
