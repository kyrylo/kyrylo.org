module TripsHelper
  def trips_form_path
    if @trip.new_record?
      trips_path
    else
      { controller: 'trips', action: 'update' }
    end
  end
end
