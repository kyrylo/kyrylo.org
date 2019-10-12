require 'redcarpet'
require 'sinatra/base'

Tilt.register(Redcarpet, 'md')

class SmartHTML < Redcarpet::Render::HTML
  include Redcarpet::Render::SmartyPants
end

class App < Sinatra::Base
  set(
    :markdown,
    renderer: SmartHTML,
    fenced_code_blocks: true,
    superscript: true,
    footnotes: true,
    no_intra_emphasis: true,
    lax_html_blocks: true,
    tables: true,
    autolink: true,
    strikethrough: true
  )

  get '/' do
    erb :index
  end

  get '/:year/:month/:day/:title' do
    file = "#{File.dirname(__FILE__)}/posts/#{params.values.join('/')}.md"
    pass unless File.exist?(file)

    post = File.read(file)
    @title = "#{post.lines.first.chomp.gsub(/<[^>]*>/ui,'')} &mdash; Kyrylo Silin"

    erb :post, locals: { post: post }
  end
end
