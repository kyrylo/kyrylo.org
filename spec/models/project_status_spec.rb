require 'spec_helper'

describe ProjectStatus do

  describe "assosications" do
    it { should have_many :projects }
  end

end
