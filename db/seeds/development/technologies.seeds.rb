[
  { name: 'Ruby',
    link: 'https://www.ruby-lang.org/' },

  { name: 'HTML',
    link: 'http://www.w3.org/html/' },

  { name: 'Markdown',
    link: 'https://daringfireball.net/projects/markdown/' },

  { name: 'Haskell' },

  { name: 'MongoDB' },

  { name: 'Ruby on Rails',
    link: 'http://rubyonrails.org/' },

  { name: 'Node.js',
    link: 'http://nodejs.org/' },

  { name: 'OCaml'},

  { name: 'WebSockets' }
].each do |technology_attributes|
  tech = Technology.find_or_initialize_by(name: technology_attributes[:name])
  tech.update_attributes(technology_attributes)
end
