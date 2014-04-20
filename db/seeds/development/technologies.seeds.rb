[
  { name: 'Ruby',
    link: 'https://www.ruby-lang.org/' },

  { name: 'Ray',
    link: 'http://mon-ouie.github.io/projects/ray.html' },

  { name: 'HTML',
    link: 'http://www.w3.org/html/' },

  { name: 'Markdown',
    link: 'https://daringfireball.net/projects/markdown/' }
].each do |technology_attributes|
  tech = Technology.find_or_initialize_by(name: technology_attributes[:name])
  tech.update_attributes(technology_attributes)
end
