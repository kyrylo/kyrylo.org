[
  { title: 'Only Black and White',
    headline: 'This website',
    description: 'This is Only Black and White' },

  { title: 'Chic et Nature',
    headline: 'Website for the Ukrainian department of a company, which sells perfumes',
    description: 'This is Chic et Nature' },

  { title: 'Kredmash Dealer',
    headline: 'Website for a dealer of the Kredmash factory that produces seaming machines',
    description: 'This is Kredmash Dealer' },

  { title: 'Entooru',
    headline: 'Translations of Ruby articles to the Russian language',
    description: 'This is Entooru' },

  { title: 'Xtopherus',
    headline: 'IRC-bot for #pry, the official channel of the Pry REPL',
    description: 'This is Xtopherus' },

  { title: 'Artaius',
    headline: 'IRC-bot for #kag2d.ru, a channel dedicated to King Arthur\'s Gold',
    description: 'This is Artaius' },

  { title: 'Patience',
    headline: 'A solitaire written in Ruby',
    description: 'This is Patience' },

  { title: 'Lovely Lambdas',
    headline: 'A Ruby library with a group of useless functions',
    description: 'This is Lovely Lambdas' },

  { title: 'Pry Theme',
    headline: 'An easy way to customise Pry colors via theme files',
    description: 'This is Pry Theme' }
].each do |project_attributes|
  project = Project.find_or_initialize_by(title: project_attributes[:title])
  project.update_attributes(project_attributes)
end
