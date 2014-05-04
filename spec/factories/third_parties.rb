FactoryGirl.define do
  factory :third_party do
    name { generate :name }

    trait :with_link do
      link { generate :link }
    end

    factory :third_party_with_link, traits: [:with_link]
  end
end
