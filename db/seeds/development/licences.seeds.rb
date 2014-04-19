[
  { name: 'MIT license',
    link: 'http://opensource.org/licenses/MIT' },

  { name: 'zlib License',
    link: 'http://opensource.org/licenses/Zlib' },

  { name: 'WTFPL',
    link: 'http://www.wtfpl.net/' },

  { name: 'Unlicense',
    link: 'http://unlicense.org/' }
].each do |licence_attributes|
  licence = Licence.find_or_initialize_by(name: licence_attributes[:name])
  licence.update_attributes(licence_attributes)
end
