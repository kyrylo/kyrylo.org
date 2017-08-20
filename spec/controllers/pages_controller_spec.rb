require 'rails_helper'

describe PagesController do
  describe "GET home" do
    it "returns http success" do
      get :home
      expect(response).to be_success
    end
  end
end
