module ProjectsHelper
  # Creates the thumbnail for the given +project+. The thumbnail depends on
  # the projects's `thumbnail` property. If a project has the thumbnail, then
  # use it, if not, then use the project's title to mimic its thumbnail.
  # @example
  #   build_thumbnail(Project.first)
  # @param [Project] project the project to build the thumbnail for
  # @return [ActiveSupport::SafeBuffer] the thumbnail with the link to the
  #   project
  def build_thumbnail(project)
    if project.thumbnail
      link_to(
        image_tag(
          project.thumbnail.picture.url,
          size:  project.thumbnail.dimensions.join('x'),
          title: project.title + 'home page',
          alt:   project.title
        )
      )
    else
      link_to project.title, project, class: 'pseudoimg'
    end
  end
end
