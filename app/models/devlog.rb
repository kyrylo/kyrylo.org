class Devlog < ActiveRecord::Base
  belongs_to :project
  has_many :devlog_entries, dependent: :destroy
end
