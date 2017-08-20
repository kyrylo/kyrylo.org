class TripsController < ApplicationController
  before_action :authenticate_user!, except: %i[index show]
  before_action :set_trip, only: %i[show edit update destroy]

  def index
    @trips = Trip.all.sort_by(&:when_end).reverse
    @title = 'Trips'
  end

  def show
  end

  def new
    @trip = Trip.new
  end

  def create
    @trip = Trip.new(trip_params)
    @trip.html = renderer.render(trip_params['markdown'])

    respond_to do |format|
      if @trip.save
        format.html { redirect_to @trip }
      else
        format.html { render action: 'new' }
      end
    end
  end

  def edit
  end

  def update
    respond_to do |format|
      html = {html: renderer.render(trip_params['markdown'])}
      new_params = html.merge(trip_params)

      if @trip.update(new_params)
        format.html { redirect_to @trip }
      else
        format.html { render action: 'edit' }
      end
    end
  end

  def destroy
    @trip.destroy
    respond_to do |format|
      format.html { redirect_to trips_url }
    end
  end

  private

  def set_trip
    @trip = Trip.find(params[:id])
  end

  def trip_params
    params.require(:trip).permit(:thumb,
                                 :where,
                                 :title,
                                 :when_start,
                                 :when_end,
                                 :markdown)
  end
end
