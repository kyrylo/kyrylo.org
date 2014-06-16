require 'rails_helper'

describe AssistantDecorator do

  describe "#nick" do
    subject { described_class.new(assistant) }

    context "assistant with nick" do
      let(:assistant) { build(:assistant, nick: 'bonaventura') }

      it "formats nick properly" do
        expect(subject.nick).to eq("(bonaventura)")
      end
    end

    context "assistant without nick" do
      let(:assistant) { build(:assistant) }

      it "formats nick properly" do
        expect(subject.nick).to be_nil
      end
    end
  end

end
