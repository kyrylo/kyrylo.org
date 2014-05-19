class AcknowledgementDecorator < Draper::Decorator
  include Draper::LazyHelpers

  decorates_association :assistant

  def assistant_mention
    content_tag(:span, class: 'assistant') do
      concat assistant_name
      if assistant_nick
        concat ' '
        concat assistant_nick
      end
    end
  end

  private

  def assistant_name
    tooltip = TooltipPresenter.new(h, model.text, assistant)
    attrs = {
      class: "full-name #{ tooltip.classname }",
      title: tooltip.to_html
    }

    content_tag(:span, attrs) { concat(assistant.full_name) }
  end

  def assistant_nick
    content_tag(:span, class: 'nickname') { assistant.nick } if assistant.nick
  end
end
