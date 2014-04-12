after 'development:projects' do
  extend(
    Module.new do
      def attachment(path, mime)
        file_path = File.join('db/seeds/development/images', path)
        Rack::Test::UploadedFile.new(File.expand_path(file_path), mime)
      end
    end
  )

  [
    ['Only Black and White', 'only-black-and-white-thumb.png', 'image/png'],
    ['Chic et Nature', 'chicetnature-thumb.png', 'image/png'],
    ['Kredmash Dealer', 'kredmash-thumb.png', 'image/png'],
    ['Entooru', 'entooru-thumb.png', 'image/png'],
    ['Artaius', 'artaius-thumb.gif', 'image/gif'],
    ['Patience', 'patience-thumb.png', 'image/png'],
    ['Pry Theme', 'pry-theme-thumb.png', 'image/png']
  ].each do |title, path, mime|
    Thumbnail.create(
      project: Project.find_by_title(title),
      picture: attachment(path, mime)
    )
  end
end
