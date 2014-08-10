source 'https://rubygems.org'

# Rails Assets is the frictionless proxy between Bundler and Bower. It
# automatically converts the packaged components into gems that are easily
# droppable into your asset pipeline and stay up to date.
# https://rails-assets.org/
source 'https://rails-assets.org'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 4.0'

# Use postgresql as the database for Active Record
gem 'pg'

# Use SCSS for stylesheets
gem 'sass-rails', '~> 4.0.0'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# Use CoffeeScript for .js.coffee assets and views
gem 'coffee-rails', '~> 4.0.0'

# See https://github.com/sstephenson/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Use jquery as the JavaScript library
gem 'jquery-rails'

# Turbolinks makes following links in your web application faster.
# https://github.com/rails/turbolinks
gem 'turbolinks'

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 1.2'

# A template language whose goal is to reduce the view syntax to the essential
# parts without becoming cryptic.
# https://github.com/slim-template/slim
gem 'slim-rails'

# A customisable CSS file that makes browsers render all elements more
# consistently and in line with modern standards.
# https://github.com/markmcconachie/normalize-rails
gem 'normalize-rails'

# Gives the seed data a little structure. Create seeds for each environment,
# share seeds between environments and specify dependencies to load seeds in
# order. All nicely integrated with simple rake tasks.
# https://github.com/james2m/seedbank
gem 'seedbank'

# An easy file attachment library for Active Record.
# https://github.com/thoughtbot/paperclip
gem 'paperclip', '~> 4.1'

# Adds an object-oriented layer of presentation logic to your Rails application.
# https://github.com/drapergem/draper
gem 'draper', '~> 1.3'

# Adds support for creating state machines for attributes on any Ruby class.
# https://github.com/pluginaweek/state_machine
# TODO: we're using a fork, since the gem doesn't work with Rails 4 yet.
# See: https://github.com/pluginaweek/state_machine/issues/295
gem 'state_machine', '~> 1.2', git: 'https://github.com/seuros/state_machine.git'

# A jQuery tooltip plugin.
# https://github.com/iamceege/tooltipster
gem 'rails-assets-tooltipster', '~> 3.2'

gem 'redcarpet'

gem 'acts-as-taggable-on'

gem 'metadown'

gem 'momentjs-rails'

gem 'friendly_id'

group :development, :test do
  # A testing framework.
  # https://github.com/rspec/rspec-core
  gem 'rspec-rails', '~> 3.0'

  # An IRB alternative and runtime developer console
  # https://github.com/pry/pry
  gem 'pry-rails', '~> 0.3'

  # An easy way to customize Pry colors via theme files
  # https://github.com/kyrylo/pry-theme
  gem 'pry-theme', '~> 1.0'

  # Provides extended documentation support for Pry.
  # https://github.com/pry/pry-doc
  gem 'pry-doc', '~> 0.6'

  # Tests web applications by simulating how a real user would interact with
  # an application.
  # https://github.com/jnicklas/capybara
  gem 'capybara'

  # A driver for Capybara. It allows to run Capybara tests on a headless WebKit
  # browser, provided by PhantomJS.
  # https://github.com/jonleighton/poltergeist
  gem 'poltergeist'

  # Comments for migrations.
  # https://github.com/pinnymz/migration_comments
  gem 'migration_comments', '~> 0.3'

  # A fixtures replacement with a straightforward definition syntax, support for
  # multiple build strategies.
  # https://github.com/thoughtbot/factory_girl_rails
  gem 'factory_girl_rails', '~> 4.4'

  # A library for generating fake data such as names, addresses, and phone
  # numbers.
  # https://github.com/stympy/faker
  gem 'faker', '~> 1.3'

  # Provides Test::Unit- and RSpec-compatible one-liners that test common Rails
  # functionality. These tests would otherwise be much longer, more complex, and
  # error-prone.
  # https://github.com/thoughtbot/shoulda-matchers
  gem 'shoulda-matchers', require: false

  # A Rails application preloader.
  # https://github.com/rails/spring
  gem 'spring', '~> 1.1'

  # Implements the rspec command for Spring.
  # https://github.com/jonleighton/spring-commands-rspec
  gem 'spring-commands-rspec'

  # A command line tool to easily handle events on file system modifications.
  # https://github.com/guard/guard
  gem 'guard', '~> 2.6'

  # Allows to automatically & intelligently install/update bundle when needed.
  # https://github.com/guard/guard-bundler
  gem 'guard-bundler', require: false

  # Automatically reload a browser when 'view' files are modified.
  # https://github.com/guard/guard-livereload
  gem 'guard-livereload', require: false

  # Automatically runs specs (much like autotest).
  # https://github.com/guard/guard-rspec
  gem 'guard-rspec', require: false

  # A ruby library for prettier-still anonymous blocks.
  # https://github.com/rapportive-oss/ampex
  gem 'ampex', '~> 3.0'
end

group :doc do
  # YARD is a documentation generation tool for the Ruby programming language.
  # https://github.com/lsegal/yard
  gem 'yard', require: false

  # RDoc generator to build searchable HTML documentation for Ruby code.
  # bundle exec rake doc:rails generates the API under doc/api.
  # https://github.com/voloko/sdoc
  gem 'sdoc', '~> 0.4', require: false
end
