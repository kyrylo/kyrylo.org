class ProjectDecorator < Draper::Decorator
  delegate :title, :incomplete?

  def first_release_date
    info_block('First release date') do
      model.first_release_date.strftime('%B %-d, %Y')
    end
  end

  def licence
    info_block('Licence') { model.licence.decorate.licence_link }
  end

  def technologies
    info_block('Technologies') do
      model.technologies.decorate.map(&:technology_link).join(', ')
    end
  end

  def third_parties
    if model.any_third_parties?
      info_block('Third party software') do
        model.third_parties.decorate.map(&:third_party_link).join(', ')
      end
    end
  end

  def acknowledgements
    if model.any_acknowledgements?
      info_block('Acknowledgements', 'acknowledgements') do
        model.acknowledgements.decorate.map(&:assistant_mention).join(h.tag(:br))
      end
    end
  end

  private

  def info_block(title, id = nil)
    h.content_tag(:div, class: 'info-block', id: id) do
      h.concat h.content_tag(:h4, title)
      h.concat yield.html_safe
    end
  end
end
