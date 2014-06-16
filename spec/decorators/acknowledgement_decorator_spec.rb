require 'rails_helper'

describe AcknowledgementDecorator do

  subject { described_class.new(ack) }

  describe "#assistant_mention" do
    context "ack with nick, text and personal page" do
      let(:ack) { build(:acknowledgement_with_nick_text_link) }

      it "builds proper HTML" do
        expect(subject.assistant_mention)
          .to match(/<span class=\"assistant\"><span class=\"full-name tooltip\" title=\"#{ack.text}.+#{ack.assistant.personal_page}.+#{ack.assistant.full_name}.+<\/span>/)
      end
    end

    context "ack with nick and text" do
      let(:ack) { build(:acknowledgement_with_nick_text) }

      it "builds proper HTML" do
        expect(subject.assistant_mention)
          .to match(/<span class=\"assistant\"><span class=\"full-name tooltip\" title=\"#{ack.text}\">#{ack.assistant.full_name}<\/span> <span class=\"nickname\">\(#{ack.assistant.nick}\)<\/span><\/span>/)
      end
    end

    context "ack with nick" do
      let(:ack) { build(:acknowledgement_with_nick) }

      it "builds proper HTML" do
        expect(subject.assistant_mention).to match(
          /<span class=\"assistant\"><span class=\"full-name \" title=\"\">#{ack.assistant.full_name}<\/span> <span class=\"nickname\">\(#{ack.assistant.nick}\)<\/span><\/span>/)
      end
    end

    context "bare ack" do
      let(:ack) { build(:acknowledgement) }

      it "builds proper HTML" do
        expect(subject.assistant_mention).to match(
          /<span class=\"assistant\"><span class=\"full-name \" title=\"\">#{ack.assistant.full_name}<\/span><\/span>/)
      end
    end
  end

end
