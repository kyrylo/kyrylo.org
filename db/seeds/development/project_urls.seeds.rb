after 'development:projects' do
  extend(
    Module.new do
      def attachment(path, mime)
        return unless path && mime
        file_path = File.join('db/seeds/development/images', path)
        Rack::Test::UploadedFile.new(File.expand_path(file_path), mime)
      end
    end
  )

  [
    ['Only Black and White', 'kyrylo.org', 'github-favicon.png', 'image/png'],
    ['Chic et Nature', 'example.com', nil, nil],
  ].each do |title, address, path, mime|
    ProjectUrl.create(
      project: Project.find_by_title(title),
      address: address,
      favicon: attachment(path, mime)
    )
  end
end
