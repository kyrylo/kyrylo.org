module TripsHelper
  def trips_form_path
    return trips_path if @trip.new_record?
    { controller: 'trips', action: 'update' }
  end
end
