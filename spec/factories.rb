FactoryGirl.define do
  sequence :project_title, aliases: [:name] do
    Faker::Commerce.product_name
  end

  sequence :headline do
    Faker::Company.catch_phrase
  end

  sequence :paragraph do
    Faker::Lorem.paragraph
  end

  sequence :word do
    Faker::Lorem.words(1)
  end

  sequence :short_text do
    Faker::Lorem.paragraph(3)
  end

  sequence :link do
    Faker::Internet.url
  end
end
