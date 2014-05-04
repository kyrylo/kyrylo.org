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

    trait :with_acknowledgements do
      after(:create) do |project|
        create_list(:acknowledgement, 3, project: project)
      end
    end

    after(:build) do |project|
      project.__send__(:initialize_state_machines, dynamic: :force)
    end

    factory :project_with_thumbnail, traits: [:with_thumbnail]
    factory :project_incomplete, traits: [:incomplete]
    factory :project_with_acknowledgements, traits: [:with_acknowledgements]
  end
end
