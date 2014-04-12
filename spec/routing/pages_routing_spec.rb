require 'spec_helper'

describe PagesController do
  describe "routing" do

    it "routes to #home" do
      expect(get: '/').to route_to('pages#home')
    end

  end
end
