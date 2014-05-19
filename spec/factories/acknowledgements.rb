FactoryGirl.define do
  factory :acknowledgement do
    assistant
    project

    trait :with_nick do
      association :assistant, factory: :assistant_with_nick
    end

    trait :with_text do
      text { generate :short_text }
    end

    trait :with_link do
      association :assistant, factory: :assistant_with_personal_page
    end

    factory :acknowledgement_with_nick_text_link, traits: [:with_nick, :with_text, :with_link]
    factory :acknowledgement_with_nick_text, traits: [:with_nick, :with_text]
    factory :acknowledgement_with_nick, traits: [:with_nick]
  end
end
