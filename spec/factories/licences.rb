FactoryGirl.define do
  factory :licence do
    name { generate :word }
    link { generate :url }
  end
end
