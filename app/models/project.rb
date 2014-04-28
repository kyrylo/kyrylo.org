class Project < ActiveRecord::Base
  has_one :thumbnail

  has_many :acknowledgements

  has_many :implementations
  has_many :technologies, through: :implementations

  has_many :subordinations
  has_many :third_parties, through: :subordinations

  belongs_to :project_status
  belongs_to :licence

  validates :title, presence: true
  validates :headline, presence: true
  validates :description, presence: true

  before_save :set_default_project_status

  # A project's status. It means that the project is usable in spite of the
  # further possible updates.
  FINISHED = 0

  # A project's status. It means that the project is not usable. Ususally, the
  # further updates are not planned in this case.
  INCOMPLETE = 1

  private

  # Every project is finished by default.
  # @return [void]
  def set_default_project_status
    self.project_status ||= ProjectStatus.find_by(status: FINISHED)
  end
end
