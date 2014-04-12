FactoryGirl.define do
  factory :project do
    title Faker::Commerce.product_name
    headline Faker::Company.catch_phrase
    description Faker::Lorem.paragraph

    factory :project_with_thumbnail do
      association :thumbnail, factory: :thumbnail_with_picture
    end
  end
end
