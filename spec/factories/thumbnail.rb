FactoryGirl.define do
  factory :thumbnail do
    factory :thumbnail_with_picture do
      picture {
        path = File.join(*%W|spec factories files thumb.png|)
        Rack::Test::UploadedFile.new(File.expand_path(path), 'image/png')
      }
    end
  end
end
