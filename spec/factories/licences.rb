FactoryGirl.define do
  factory :licence do
    name { generate :word }
    link { generate :link }
  end
end
