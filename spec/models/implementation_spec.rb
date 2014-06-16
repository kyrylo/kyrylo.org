require 'rails_helper'

describe Implementation do

  describe "associations" do
    it { should belong_to :project }
    it { should belong_to :technology }
  end

end
