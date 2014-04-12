require 'spec_helper'

describe ProjectsController do

  describe "GET index" do
    before do
      get :index
    end

    it "returns http success" do
      expect(response).to be_success
    end

    context "no existing projects" do
      it "collects all projects and stores them" do
        expect(assigns(:projects)).to be_empty
      end

      it "assigns the projects counter" do
        expect(assigns(:projects_count)).to equal(0)
      end
    end

    context "some projects exist" do
      before do
        FactoryGirl.create(:project)
        get :index
      end

      it "collects all projects and stores them" do
        expect(assigns(:projects)).not_to be_empty
      end

      it "assigns the projects counter" do
        expect(assigns(:projects_count)).to equal(1)
      end
    end
  end

end
