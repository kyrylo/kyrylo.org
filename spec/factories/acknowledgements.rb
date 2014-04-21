FactoryGirl.define do
  factory :acknowledgement do
    description Faker::Lorem.sentence(2)
    assistant nil
  end
end
