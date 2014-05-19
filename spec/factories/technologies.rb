FactoryGirl.define do
  factory :technology do
    name { generate :word }

    trait :with_link do
      link { generate :link }
    end

    factory :technology_with_link, traits: [:with_link]
  end
end
