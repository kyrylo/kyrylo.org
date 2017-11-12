source 'https://rubygems.org'

gem 'rails', '= 5.1.4'

gem 'autoprefixer-rails', '~> 7.1'
gem 'pg', '~> 0.21'
gem 'sass-rails', '~> 5.0'
gem 'uglifier', '~> 3.2.0'
gem 'redcarpet', '~> 3.4'
gem 'metadown', '~> 1.0'
gem 'friendly_id', '~> 5.2'
gem 'cancancan', '~> 2.0.0'
gem 'devise', '~> 4.3'
gem 'paperclip', '~> 5.1'
gem 'airbrake', '~> 6.2'

group :development do
  gem 'rubocop', '~> 0.49', require: false
end

group :test do
  gem 'rspec-rails', '~> 3.6'
end

group :development, :test do
  gem 'pry-rails', '~> 0.3'
end

group :staging, :production do
  gem 'rack', '~> 2.0'
  gem 'unicorn', '~> 5.3'
end
