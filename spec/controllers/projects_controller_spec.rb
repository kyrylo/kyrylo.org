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
        create(:project)
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

  describe "GET show" do
    let(:valid_session) { {} }
    let(:project) { create(:project) }

    before { get :show, { id: project.to_param }, valid_session }

    it "decorates project" do
      expect(assigns(:project)).to be_decorated
    end

    it "assigns the requested project as @project" do
      expect(assigns(:project)).to eq(project)
    end
  end

end
