FactoryGirl.define do
  factory :project_status do
    trait :finished do
      status 0
      explanation 'Finished'
    end

    trait :incomplete do
      status 1
      explanation 'Incomplete'
    end

    factory :project_status_finished, traits: [:finished]
    factory :project_status_incomplete, traits: [:incomplete]
  end
end
