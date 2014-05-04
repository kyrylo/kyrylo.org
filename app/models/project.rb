class Project < ActiveRecord::Base
  has_one :thumbnail

  has_many :acknowledgements

  has_many :implementations
  has_many :technologies, through: :implementations

  has_many :subordinations
  has_many :third_parties, through: :subordinations

  belongs_to :licence

  validates :title, presence: true
  validates :headline, presence: true
  validates :description, presence: true


  # A project's state. It means that the project is usable in spite of the
  # further possible updates.
  FINISHED = :finished

  # A project's state. It means that the project is not usable. Ususally, the
  # further updates are not planned in this case.
  INCOMPLETE = :incomplete

  state_machine :state, initial: FINISHED do
    event :mark_as_incomplete do
      transition FINISHED => INCOMPLETE
    end

    event :finish do
      transition INCOMPLETE => FINISHED
    end

    state FINISHED
    state INCOMPLETE
  end

  # Checks whether any third party software was used in order to create the
  # project.
  # @return [Boolean]
  def any_third_parties?
    third_parties.any?
  end

  # Checks whether anyone helped to create the project.
  # @return [Boolean]
  def any_acknowledgements?
    acknowledgements.any?
  end
end
