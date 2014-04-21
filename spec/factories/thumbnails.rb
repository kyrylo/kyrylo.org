FactoryGirl.define do
  factory :thumbnail do
    trait :with_picture do
      picture do
        path = File.join(*%W|spec factories files thumb.png|)
        Rack::Test::UploadedFile.new(File.expand_path(path), 'image/png')
      end
    end

    factory :thumbnail_with_picture, traits: [:with_picture]
  end
end
