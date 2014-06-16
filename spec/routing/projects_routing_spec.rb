require 'rails_helper'

describe ProjectsController do
  describe "routing" do

    it "routes to #index" do
      expect(get: '/projects').to route_to('projects#index')
    end

  end
end
