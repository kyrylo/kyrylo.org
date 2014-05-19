FactoryGirl.define do
  factory :licence do
    name { generate :word }

    trait :with_link do
      link { generate :link }
    end

    factory :licence_with_link, traits: [:with_link]
  end
end
