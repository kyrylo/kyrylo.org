require 'yard'

namespace :yard do
  desc 'Generate YARD docs for the app'
  task :app do
    # YARD::Rake::YardocTask does not work for me for some reason.
    system('yard --single-db --output-dir doc/app')
  end
end
