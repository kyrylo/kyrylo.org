class TechnologyDecorator < Draper::Decorator
  def technology_link
    h.link_to_if model.link, model.name, model.link
  end
end
