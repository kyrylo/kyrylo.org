require 'rails_helper'

describe "avatar", js: true do
  let(:classname) { '.banner .avatar' }

  before do
    visit root_path

    @avatar_elem = find(classname)
  end

  describe "clicking" do
    it "flips it to the other image by a CSS3 transition and vice versa" do
      expect(@avatar_elem['class']).to eq('avatar')

      @avatar_elem.click
      expect(@avatar_elem['class']).to eq('avatar flip')

      @avatar_elem.click
      expect(@avatar_elem['class']).to eq('avatar')
    end
  end

  describe "hovering" do
    it "creates a visual effect of raising" do
      front_img = @avatar_elem.find('.front img')
      back_img = @avatar_elem.find('.back img')

      expect(front_img['class']).to eq(nil)
      expect(back_img['class']).to eq(nil)

      @avatar_elem.hover

      expect(front_img['class']).to eq('hovered')
      expect(back_img['class']).to eq('hovered')
    end
  end
end
