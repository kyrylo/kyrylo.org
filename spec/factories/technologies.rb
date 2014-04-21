FactoryGirl.define do
  factory :technology do
    name { generate :word }
    link { generate :link }
  end
end
