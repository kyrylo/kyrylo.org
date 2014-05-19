class AssistantDecorator < Draper::Decorator
  delegate_all

  def nick
    %|(#{ model.nick })| if model.nick
  end
end
