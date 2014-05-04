FactoryGirl.define do
  factory :subordination do
    project

    trait :with_third_party do
      third_party
    end

    factory :subordination_with_third_party, traits: [:with_third_party]
  end
end
