class LicenceDecorator < Draper::Decorator
  delegate_all

  def licence_link
    h.link_to_if model.link, model.name, model.link
  end
end
