class Project < ActiveRecord::Base
  PROJECT_LIST = {
    'Patience' => {
      link: 'https://github.com/kyrylo/patience',
      date: 'March 8, 2012',
      desc: 'Solitaire card game implemented in Ruby using the Gosu framework.'
    },
    'Entooru' => {
      link: 'https://github.com/kyrylo/entooru',
      date: 'April 16, 2012',
      desc: 'A collection of my translations of various Ruby articles into the Russian language.'
    },
    'Pry Theme' => {
      link: 'https://github.com/kyrylo/pry-theme',
      date: 'June 26, 2012',
      desc: 'A plugin for the Pry REPL for the Ruby programming language, which allows to customise Pry colors via prytheme.rb files.'
    },
    'Fast Method Source' => {
      link: 'https://github.com/kyrylo/fast_method_source',
      date: 'June 18, 2015',
      desc: 'A Ruby C extension for querying methods, procs and lambdas for their source code and comments. Extremely fast.'
    },
    'System Browser' => {
      link: 'https://github.com/kyrylo/system_browser_client',
      date: 'July 21, 2015',
      desc: 'A desktop app for browsing Ruby code. Just click to get details about a module or class and explore its namespace or see the source of a method.'
    },
    'System Navigation' => {
      link: 'https://github.com/kyrylo/system_navigation',
      date: 'June 11, 2015',
      desc: 'A library for the Ruby programming language that provides navigation and introspection capabilities for Ruby programs.'
    },
    'RMarshal' => {
      link: 'https://github.com/kyrylo/rmarshal',
      date: 'December 18, 2014',
      desc: 'An Erlang library for deserialising Ruby objects dumped by Marshal.dump into Erlang terms.'
    }
  }

  extend FriendlyId
  friendly_id :title, use: %i[slugged history finders]

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
