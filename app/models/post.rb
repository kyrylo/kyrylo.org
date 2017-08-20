class Post < ActiveRecord::Base
  acts_as_taggable
  extend FriendlyId
  friendly_id :title, use: %i[slugged history finders]

  KNOWN_TAGS = [
    'article',
    'translation',
    'design'
  ]

  def type
    tag_list.find { |tag| KNOWN_TAGS.include?(tag) } || 'other publication'
  end
end
