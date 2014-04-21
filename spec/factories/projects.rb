FactoryGirl.define do
  factory :project do
    title { generate :project_title }
    headline { generate :headline }
    description { generate :paragraph }

    trait :with_thumbnail do
      association :thumbnail, factory: :thumbnail_with_picture
    end

    factory :project_with_thumbnail, traits: [:with_thumbnail]
  end
end
