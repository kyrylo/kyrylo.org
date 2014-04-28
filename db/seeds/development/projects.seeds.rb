after 'project_statuses', 'development:licences', 'development:technologies', 'development:third_parties' do
  [
    { title: 'Only Black and White',
      headline: 'This website',
      description: 'This is Only Black and White',
      first_release_date: Date.new(2014, 5, 15),
      project_status: ProjectStatus.find_by(status: 1),
      licence: Licence.find_by(name: 'Unlicense'),
      technologies: [
        Technology.find_by(name: 'Ruby'),
        Technology.find_by(name: 'Ray'),
        Technology.find_by(name: 'HTML'),
        Technology.find_by(name: 'Markdown')],
      third_parties: [
        ThirdParty.find_by(name: 'PT Sans'),
        ThirdParty.find_by(name: 'PT Serif'),
        ThirdParty.find_by(name: 'Cinch'),
        ThirdParty.find_by(name: 'Bacon')] },

    { title: 'Chic et Nature',
      headline: 'Website for the Ukrainian department of a company, which sells perfumes',
      description: 'This is Chic et Nature',
      first_release_date: Date.new(2010, 3, 2),
      licence: Licence.find_by(name: 'MIT license'),
      technologies: [Technology.find_by(name: 'HTML')],
      third_parties: [
        ThirdParty.find_by(name: 'PT Sans')] },

    { title: 'Kredmash Dealer',
      headline: 'Website for a dealer of the Kredmash factory that produces seaming machines',
      description: 'This is Kredmash Dealer',
      first_release_date: Date.new(2010, 6, 28),
      licence: Licence.find_by(name: 'WTFPL'),
      third_parties: [
        ThirdParty.find_by(name: 'PT Serif')] },

    { title: 'Entooru',
      headline: 'Translations of Ruby articles to the Russian language',
      description: 'This is Entooru',
      first_release_date: Date.new(2012, 12, 2),
      licence: Licence.find_by(name: 'zlib License') },

    { title: 'Xtopherus',
      headline: 'IRC-bot for #pry, the official channel of the Pry REPL',
      description: 'This is Xtopherus',
      first_release_date: Date.new(2013, 3, 3),
      licence: Licence.find_by(name: 'MIT license') },

    { title: 'Artaius',
      headline: 'IRC-bot for #kag2d.ru, a channel dedicated to King Arthur\'s Gold',
      description: 'This is Artaius',
      first_release_date: Date.new(2012, 3, 1),
      licence: Licence.find_by(name: 'WTFPL') },

    { title: 'Patience',
      headline: 'A solitaire written in Ruby',
      description: 'This is Patience',
      first_release_date: Date.new(2011, 9, 9),
      project_status: ProjectStatus.find_by(status: 1),
      licence: Licence.find_by(name: 'zlib License') },

    { title: 'Lovely Lambdas',
      headline: 'A Ruby library with a group of useless functions',
      description: 'This is Lovely Lambdas',
      first_release_date: Date.new(2013, 2, 1),
      licence: Licence.find_by(name: 'Unlicense') },

    { title: 'Pry Theme',
      headline: 'An easy way to customise Pry colors via theme files',
      description: 'This is Pry Theme',
      first_release_date: Date.new(2012, 7, 19),
      licence: Licence.find_by(name: 'zlib License') }
  ].each do |project_attributes|
    project = Project.find_or_initialize_by(title: project_attributes[:title])
    project.update_attributes(project_attributes)
  end
end
