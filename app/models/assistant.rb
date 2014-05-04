class Assistant < ActiveRecord::Base
  has_many :acknowledgements

  validates :full_name, presence: true
  validates :nick, presence: true, allow_blank: false, allow_nil: true
  validates :personal_page, presence: true, allow_blank: false, allow_nil: true
end
