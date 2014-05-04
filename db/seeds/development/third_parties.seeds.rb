[
  { name: 'PT Sans',
    link: 'http://www.paratype.com/public/' },

  { name: 'PT Serif',
    link: 'http://www.paratype.com/public/' },

  { name: 'Backbone.js' },

  { name: 'Pry',
    link: 'http://pryrepl.org/' },

  { name: 'Ray',
    link: 'http://mon-ouie.github.io/projects/ray.html' },

  { name: 'Draper' },

  { name: 'RSpec' },

  { name: 'Fancy images pack' },

  { name: 'Factory Girl',
    link: 'https://github.com/thoughtbot/factory_girl' },

  { name: 'Bacon',
    link: 'https://github.com/chneukirchen/bacon' }
].each do |tp_attributes|
  tp = ThirdParty.find_or_initialize_by(name: tp_attributes[:name])
  tp.update_attributes(tp_attributes)
end
