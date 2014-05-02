FactoryGirl.define do
  factory :project do
    title { generate :project_title }
    headline { generate :headline }
    description { generate :paragraph }

    trait :with_thumbnail do
      association :thumbnail, factory: :thumbnail_with_picture
    end

    trait :incomplete do
      after(:build) do |project|
        project.mark_as_incomplete
      end
    end

    after(:build) do |project|
      project.__send__(:initialize_state_machines, dynamic: :force)
    end

    factory :project_with_thumbnail, traits: [:with_thumbnail]
    factory :project_incomplete, traits: [:incomplete]
  end
end
