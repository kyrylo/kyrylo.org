FactoryGirl.define do
  factory :assistant do
    full_name { generate :full_name }

    trait :with_nick do
      nick { generate :word }
    end

    trait :with_personal_page do
      personal_page { generate :link }
    end

    factory :assistant_with_personal_page, traits: [:with_personal_page]
    factory :assistant_with_nick, traits: [:with_nick]
  end
end
