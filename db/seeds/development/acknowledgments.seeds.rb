after 'development:projects', 'development:assistants' do
  [
    { project: Project.find_by(title: 'Only Black and White'),
      assistant: Assistant.find_by(full_name: 'Bil Bas') },

    { project: Project.find_by(title: 'Only Black and White'),
      assistant: Assistant.find_by(full_name: 'Chris Gahan'),
      text: 'Never forget you!' },

    { project: Project.find_by(title: 'Only Black and White'),
      assistant: Assistant.find_by(full_name: 'John Smith'),
      text: 'Invaluable contributions' },

    { project: Project.find_by(title: 'Only Black and White'),
      assistant: Assistant.find_by(full_name: 'Andy Schmandy'),
      text: 'We are proud of you' },

    { project: Project.find_by(title: 'Kredmash Dealer'),
      assistant: Assistant.find_by(full_name: 'John Smith'),
      text: "This guy wasn't very helpful, but thanks anyway" },

    { project: Project.find_by(title: 'Entooru'),
      assistant: Assistant.find_by(full_name: 'Andy Schmandy'),
      text: 'Did you really help me?' },

    { project: Project.find_by(title: 'Entooru'),
      assistant: Assistant.find_by(full_name: 'John Smith'),
      text: 'Motivator' },

    { project: Project.find_by(title: 'Patience'),
      assistant: Assistant.find_by(full_name: 'Bil Bas'),
      text: 'Cannot even express the assistance' },

    { project: Project.find_by(title: 'Pry Theme'),
      assistant: Assistant.find_by(full_name: 'Chris Gahan'),
      text: 'Unbelieveable helping, yo' },

    { project: Project.find_by(title: 'Pry Theme'),
      assistant: Assistant.find_by(full_name: 'John Smith'),
      text: 'Helped to promote the project. I guess' },

    { project: Project.find_by(title: 'Pry Theme'),
      assistant: Assistant.find_by(full_name: 'Andy Schmandy') }
  ].each do |ack_attrs|
    ack = Acknowledgement.find_or_initialize_by(
      project: ack_attrs[:project],
      assistant: ack_attrs[:assistant]
    )
    ack.update_attributes(ack_attrs)
  end
end
