# Represents a tooltip with text and a link. It's meant to be used by the
# {AcknowledgementDecorator} class to display acknowledgements.
class TooltipPresenter
  # Creates a new tooltip object, which carries the text of the tooltip and the
  # assistant the personal page of whom is used in order to display the link.
  # @param [Draper::ViewContext] view the main interest is in the view's helper
  #   methods such as {ActionView::Base#link_to}, etc.
  # @param [String, nil] text the text of the tooltip to be displayed. +nil+ will
  #   be converted to an empty string
  # @param [Assistant] assistant the person, which associates with the tooltip
  def initialize(view, text, assistant)
    @view = view
    @text = String(text)
    @assistant = assistant
  end

  # Converts the tooltip to HTML.
  # @return [String] the HTML markup
  def to_html
    @text + personal_page
  end

  # @return [String, nil] the CSS class name if the tooltip has some text,
  #   otherwise returns +nil+
  def classname
    'tooltip' unless @text.blank?
  end

  private

  # Extracts the personal page of the assistant and returns HTML with the link
  # to it.
  # @return [String, ActiveSupport::SafeBuffer] the markup of the personal page
  def personal_page
    return '' unless @assistant.personal_page

    @view.content_tag(:div) do
      @view.link_to 'Visit personal page', @assistant.personal_page
    end
  end
end
