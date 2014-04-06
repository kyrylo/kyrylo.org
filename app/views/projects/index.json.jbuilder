json.array!(@projects) do |project|
  json.extract! project, :id, :title, :headline, :description
  json.url project_url(project, format: :json)
end
