[
  { status: 0,
    explanation: 'Finished' },

  { status: 1,
    explanation: 'Incomplete' },
].each do |ps_attrs|
  ps = ProjectStatus.find_or_initialize_by(status: ps_attrs[:status])
  ps.update_attributes(ps_attrs)
end
