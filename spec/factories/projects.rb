FactoryGirl.define do
  factory :project do
    title { generate :project_title }
    headline { generate :headline }
    description { generate :paragraph }
    first_release_date Date.new(2012, 12, 3)
    association :licence, factory: :licence

    trait :with_thumbnail do
      association :thumbnail, factory: :thumbnail_with_picture
    end

    trait :incomplete do
      after(:build) do |project|
        project.mark_as_incomplete
      end
    end

    trait :with_unique_acknowledgements do
      after(:create) do |project|
        project.acknowledgements << build(:acknowledgement_with_nick_text_link)
        project.acknowledgements << build(:acknowledgement_with_nick_text)
        project.acknowledgements << build(:acknowledgement_with_nick)
        project.acknowledgements << build(:acknowledgement)
      end
    end

    trait :with_third_party_software do
      after(:create) do |project|
        project.third_parties << build(:third_party)
        project.third_parties << build(:third_party_with_link)
      end
    end

    after(:build) do |project|
      project.__send__(:initialize_state_machines, dynamic: :force)
    end

    factory :project_with_thumbnail, traits: [:with_thumbnail]
    factory :project_incomplete, traits: [:incomplete]
    factory(:project_with_unique_acknowledgements,
      aliases: [:project_with_acknowledgements],
      traits: [:with_unique_acknowledgements]
    )
    factory(:project_stuffed,
      traits: [
        :with_thumbnail,
        :with_unique_acknowledgements,
        :with_third_party_software
      ])
  end
end
