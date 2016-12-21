#' Sample events data
#'
#' A sample set of observed events, one might imagine these are sightings of different species of animals at specific locations (motion-activated cameras) - identified by the `station` column. Note that this is a randomised data set and is not indicative of the true migratory behaviour of e.g. meerkats, cougars and polar bears.
#'
#' @format A data frame with 6621 rows and 6 variables:
#' \describe{
#'   \item{station}{station, unique identifier for each observation used which must be set as place.key.}
#'   \item{time}{time, when the event was observed, in as.POSIXct format.}
#'   \item{event_type}{species, species identification, i.e. cougar, kitten, stick insect.}
#'   \item{event_type_id}{species, unique id for each species ranging from 0-36}
#'   \item{radius}{radius, size of event when displayed.}
#'   \item{color}{color, color for the species type}
#'   \item{place_id}{placed_id, id of the location (place) where the event was observed, corresponding to the id in `places`}
#'   \item{title}{title, text to show in the tooltip for each event.}
#' }
"sample_events_data"

#' Sample locations data
#'
#' The locations of motion-activated camera traps that recorded the events from `sample_events_data`, with (x,y) coordinates. Note that for data sensitivity reasons the coordinates are not required to be valid longitude/latitude pairs.
#'
#' @format A data frame with 99 rows and 6 variables:
#' \describe{
#'   \item{id}{id, Unique id for each location, ranging from 0 - 98. Note that these ids correspond to the `place_id` in `sample_events_data`}
#'   \item{x}{x, x coordinate of each locations}
#'   \item{y}{y, y coordinate of each locations}
#'   \item{color}{color, color of each location}
#'   \item{radius}{radius, radiues of each location}
#'   \item{title}{title, tooltip text displayed when hovering over the location}
#' }
"sample_locations_data"