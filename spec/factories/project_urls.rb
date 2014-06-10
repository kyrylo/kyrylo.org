FactoryGirl.define do
  factory :project_url do
    address { generate :website }

    trait :with_favicon do
      favicon do
        path = File.join(*%W|spec factories files favicon.png|)
        Rack::Test::UploadedFile.new(File.expand_path(path), 'image/png')
      end
    end

    factory :project_url_with_favicon, traits: [:with_favicon]
  end
end
