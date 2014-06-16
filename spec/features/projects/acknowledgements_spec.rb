require 'rails_helper'

describe "projects/acknowledgements", js: true do
  self.use_transactional_fixtures = false

  let(:project) { create(:project_with_unique_acknowledgements) }
  let(:assistants) { project.acknowledgements.map(&:assistant) }
  let(:scope) { find('#acknowledgements') }

  before { visit project_path(project) }
  after { Project.destroy_all }

  describe "assistant mentions" do
    it "displays the correct number of mentions" do
      expect(scope).to have_selector('.assistant', count: 4)
    end

    it "displays the correct number of assistants with nicks" do
      expect(scope).to have_selector('.nickname', count: 2)
    end
  end

  describe "assistant nicknames" do
    let(:nicked_guys) { assistants.select(&:nick) }
    let(:nickless_guys) { assistants.reject(&:nick) }

    shared_examples "presence" do |idx|
      it "displays all the assistants with nicks (#{idx.succ})" do
        expect {
          scope.find('.nickname',  text: "#{nicked_guys[idx].nick})", count: 2)
        }.not_to raise_error
      end
    end

    (0..1).each { |idx| include_examples 'presence', idx }

    shared_examples "absence" do |idx|
      it "doesn't display the assistant's nickname #{ idx.succ }" do
        expect {
          scope.find('.nickname', text: nickless_guys[idx].full_name)
        }.to raise_error(Capybara::ElementNotFound)
      end
    end

    (0..1).each { |idx| include_examples 'absence', idx }
  end

  describe "tooltips" do
    let(:css_class) { '.tooltipster-content' }
    let(:thanked_guys) { assistants.select(&X.acknowledgements.find(&:text)) }
    let(:thanked_guy) { thanked_guys.first }
    let(:thanked_guy_with_page) { thanked_guys.find(&:personal_page) }
    let(:nonthanked_guys){ assistants.select(&X.acknowledgements.reject(&:text))}

    describe "layout" do
      shared_examples "highlightion with text" do |idx|
        it "highlights the assistant with the acknowledgement text" do
          expect {
            scope.find('.tooltip', text: thanked_guys[idx].full_name)
          }.not_to raise_error
        end
      end

      (0..1).each { |idx| include_examples 'highlightion with text', idx }

      shared_examples "highlightion without text" do |idx|
        it "doesn't highlight the assistant without the acknowledgement text" do
          expect {
            scope.find('.tooltip', text: nonthanked_guys[idx].full_name)
          }.to raise_error
        end
      end

      (0..1).each { |idx| include_examples 'highlightion without text', idx }
    end

    describe "clicking" do
      let(:other_thanked_guy) { thanked_guys.last }

      before { expect(page).not_to have_selector(css_class) }

      context "tooltip is closed" do
        before { scope.find('.tooltip', text: thanked_guy.full_name).click }
        it "reveals the acknowledgment" do
          expect(page).to have_selector(css_class)
        end
      end

      context "tooltip is open" do
        before do
          2.times { scope.find('.tooltip', text: thanked_guy.full_name).click }
        end

        describe "the same tooltip link" do
          it "hides the tooltip" do
            expect(page).not_to have_selector(css_class)
          end
        end

        describe "another tooltip link" do
          it "hides the previous tooltip and shows a new one" do
            old_text = page.find(css_class).text
            scope.find('.tooltip', text: other_thanked_guy.full_name).click
            new_text = page.find(css_class).text

            expect(old_text).not_to eq(new_text)
          end
        end

        describe "anywhere on the page" do
          before { page.find('body').click }

          it "hides the tooltip" do
            expect(page).not_to have_selector(css_class)
          end
        end
      end
    end

    describe "content" do
      describe "text" do
        before { scope.find('.tooltip', text: thanked_guy.full_name).click }

        subject { thanked_guy.acknowledgements[0].text }
        it "matches with the assistant's acknowledgement" do
          expect(subject).to eq(page.find(css_class).text)
        end
      end

      describe "personal page" do
        context "the assitant doesn't have a personal page" do
          before { scope.find('.tooltip', text: thanked_guy.full_name).click }

          it "is not present in the tooltip" do
            expect(page.find(css_class)).not_to have_selector('a')
          end
        end

        context "the assistant has a personal page" do
          before do
            scope.find('.tooltip', text: thanked_guy_with_page.full_name).click
          end

          it "displays the link to the personal page" do
            expect(page.find(css_class)).to have_selector('a')
          end
        end
      end
    end
  end

end
