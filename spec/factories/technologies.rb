FactoryGirl.define do
  factory :technology do
    name Faker::Lorem.words(1)
    link Faker::Internet.url
  end
end
