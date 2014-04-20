[
  { name: 'PT Sans',
    link: 'http://www.paratype.com/public/' },

  { name: 'PT Serif',
    link: 'http://www.paratype.com/public/' },

  { name: 'Bacon',
    link: 'https://github.com/chneukirchen/bacon' },

  { name: 'Cinch',
    link: 'https://github.com/cinchrb/cinch' }
].each do |tp_attributes|
  tp = ThirdParty.find_or_initialize_by(name: tp_attributes[:name])
  tp.update_attributes(tp_attributes)
end
