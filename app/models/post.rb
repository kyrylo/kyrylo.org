class Post < ActiveRecord::Base
  extend FriendlyId
  friendly_id :title, use: %i[slugged history finders]
end
