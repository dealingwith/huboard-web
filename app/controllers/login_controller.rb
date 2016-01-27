class LoginController < ApplicationController
  layout false
  def logout
    request.env['warden'].logout 
    redirect_to "/"
  end
  def public
    scope_strategy = :public
    #request.env['warden'].logout if github_authenticated? :private
    github_authenticate! scope_strategy
    redirect_to params[:redirect_to] || "/"
  end
  def private
#    request.env['warden'].logout if github_authenticated? :default
    github_authenticate! :private
    redirect_to params[:redirect_to] || "/"
  end
  def public_callback
    redirect_to params[:redirect_to] || "/"
  end
  def private_callback
    redirect_to params[:redirect_to] || "/"
  end
end
