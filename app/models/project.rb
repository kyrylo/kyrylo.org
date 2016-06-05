class Project < ActiveRecord::Base
  PROJECT_LIST = {
    'Entooru' => {
      link: 'https://github.com/kyrylo/entooru',
      date: 'April 16, 2012',
      desc: 'My translations of Ruby articles into Russian'
    },
    'Pry Theme' => {
      link: 'https://github.com/kyrylo/pry-theme',
      date: 'June 26, 2012',
      desc: 'A plugin for the Pry REPL, which paints Pry output according to the selected theme'
    },
    'OpenRA maps' => {
      link: 'https://github.com/kyrylo/pry-theme',
      date: 'April 09, 2015',
      desc: 'A few maps of mine are included into the official OpenRA distribution'
    },
    'Fast Method Source' => {
      link: 'https://github.com/kyrylo/fast_method_source',
      date: 'June 18, 2015',
      desc: 'A Ruby library for source code extraction from methods & procs'
    }
  }

  extend FriendlyId
  friendly_id :title, use: [:slugged, :history, :finders]

  has_one :devlog
  has_many :project_links
  before_destroy { project_links.destroy_all if ProjectLink.table_exists? }
  accepts_nested_attributes_for(
    :project_links,
    reject_if: lambda {
      |attributes| attributes['href'].blank?
    }
  )
end
