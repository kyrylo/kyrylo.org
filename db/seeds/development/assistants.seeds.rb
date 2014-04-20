[
  { full_name: 'Bil Bas',
    nick: 'Spooner',
    personal_page: 'http://spooner.github.io/' },

  { full_name: 'Chris Gahan',
    nick: 'epitron',
    personal_page: 'http://chris.ill-logic.com/' },

  { full_name: 'John Smith',
    nick: '',
    personal_page: '' },

  { full_name: 'Andy Schmandy',
    nick: '',
    personal_page: 'http://example.com/' },
].each do |assistant_attrs|
  asst = Assistant.find_or_initialize_by(full_name: assistant_attrs[:full_name])
  asst.update_attributes(assistant_attrs)
end
