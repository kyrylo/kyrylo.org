module DevlogEntriesHelper
  def display_title(id)
    note = "Note #{id}"
    title = link_to_unless_current(@devlog_entry.title,
                                   devlog_entry_project_devlog_path(@project,
                                                                    @devlog_entry))
    [note, '&mdash;', title].join('&nbsp;')
  end

  def submit_path
    if @devlog_entry.new_record?
      project_devlog_devlog_entries_path(@devlog_entry.devlog.project,
                                         @devlog_entry)
    else
      devlog_entry_path(@devlog_entry)
    end
  end
end
