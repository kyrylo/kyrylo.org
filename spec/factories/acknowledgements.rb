FactoryGirl.define do
  factory :acknowledgement do
    text { generate :short_text }
    assistant
  end
end
