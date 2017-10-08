Kyrylo::Application.routes.draw do
  devise_for :users

  root 'pages#home'

  resources :posts, except: %i[index]
  resources :trips, except: %i[index]

  get '/cv', to: 'pages#cv'
end
