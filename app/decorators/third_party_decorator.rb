class ThirdPartyDecorator < Draper::Decorator
  delegate_all

  def third_party_link
    h.link_to_if model.link, model.name, model.link
  end
end
