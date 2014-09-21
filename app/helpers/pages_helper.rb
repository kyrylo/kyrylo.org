module PagesHelper
  def render_inner_tags(tag_list, title_tag)
    filtered_tags = tag_list.reject { |tag| tag == title_tag }
    render_tags(filtered_tags)
  end
end
