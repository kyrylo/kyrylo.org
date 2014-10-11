class Post < ActiveRecord::Base
  acts_as_taggable
  extend FriendlyId
  friendly_id :title, use: [:slugged, :history, :finders]

  KNOWN_TAGS = [
    'article',
    'translation',
    'project',
    'trip',
    'design'
  ]

  def type
    tag_list.find { |tag| KNOWN_TAGS.include?(tag) } || 'other publication'
  end
end
