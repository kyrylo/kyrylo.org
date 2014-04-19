FactoryGirl.define do
  factory :licence do
    name Faker::Lorem.words(1)
    link Faker::Internet.url
  end
end
