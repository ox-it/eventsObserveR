# // Developed by Ken Kahn and Martin Hadley of IT Services, University of Oxford
# // Copyright University of Oxford 2016, MIT License
#' eventsObserver
#' 
#' \code{eventsObserveR} creates an playable visualisation of the distribution of event observations over a range of defined places within a variable time period.
#' @importFrom base64enc dataURI
#' @param events A data.frame with events, needs at least place.key, time and place_id
#' \itemize{
#'   \item{"place.key"}{ : place.key, unique identifier for each observation used which must be set as place.key.}
#'   \item{"time"}{ : time, when the event was observed, in as.POSIXct format.}
#'   \item{"radius"}{ : radius, size of event when displayed.}
#'   \item{"color"}{ : color, color for the event}
#'   \item{"place_id"}{ : id of the location (place) where the event was observed. Must be given if `places` is not NULL.}
#'   \item{"event_type_id"}{ : event type id ranging from 0 - (number_of_event_types - 1). Used by the legend for grouping.}
#'   \item{"shape"}{ : shape of event}
#'  }
#'  
#' @param places An optional data.frame for place locations, if NULL places will be set to fill outline a circle that fills the available space. Default to NULL
#' \itemize{
#'   \item{id}{id, Unique id for each location, ranging from 0 - 98. Note that these ids correspond to the `place_id` in `sample_events_data`}
#'   \item{"x"}{ : x coordinate of each locations}
#'   \item{"y"}{ : y coordinate of each locations}
#'   \item{"color"}{ : color of each location}
#'   \item{"radius"}{ : radiues of each location}
#'   \item{"title"}{ : tooltip text displayed when hovering over the location}
#'  }
#' @param place.key Name of column containing place.key in the events data.frame (defaults to place).
#' @param periodsPerSecond Equivalent to number of "frames per second when playing" the eventsObserver animation. Default 24.
#' @param period Period within which events must occur to be displayed as filled dots. Default to 86400 seconds.
#' @param period.unit Unit (seconds, hours, days) used to calculate the length of the `period`. Default to "days".
#' @param previousPeriodDuration Period within which events occuring prior to "period" will be included in the visualisation and displayed as empty dots. Default to 86400 seconds.
#' @param previous.period.unit Unit (seconds, hours, days) used to calculate the length of the `previous.period`. Default to "days".
#' @param size Optional list of named arguments:
#' \itemize{
#'  \item{"view.width"}{ : width of area containing both the events viewer and the play/pause controls. Default to 700px}
#'  \item{"view.height"}{ : height of area containing both the events viewer and the play/pause controls. Default to 500px}
#'  \item{"interface.width"}{ : width of the entire interface, must be larger than view.width. If the legend cannot fit to the right, it will be shown below. Note, however, that the viewer and legend are allowed to rescale themselves dynamically. Default to 1024}
#'  \item{"interface.height"}{ : height of the entire interface, must be larger than view.height. If the legend cannot fit to the right, it will be shown below. Note, however, that the viewer and legend are allowed to rescale themselves dynamically. Default to 786}
#'  \item{"horizontal.margin"}{ : margin width placed around the events viewer to prevent events displaying outside the interface. Default to 100px}
#'  \item{"vertical.margin"}{ : margin height placed around the events viewer to prevent events displaying outside the interface. Default to 100px}
#'  }
#' @param place.radius Radius for circles representing locations for events, used only if `places` is not NULL. Otherwise the radius column in `places` is used.
#' @param shape.type Type of shape to use for events, defaults to "circle". Can be path to svg images.
#' @param event.radius Radius for events, default to 5. Only used if a column called "radius" in `events` is not given.
#' @param event.color Color of events, only used if a column called "color" is not given in `events`. Default is "red".
#' @param place.color Color for places, default to "lavenderblush". Only used if a column called "color" in `places` is not given.
#' @param legend An optional data.frame for legend labelling events by type. Default to FALSE.
#' \itemize{
#'     \item{"event_type_id"}{ : unique "event type" id" corresponding to the event_type_id column in \code{events}}
#'     \item{"description"}{ : label for event type in the legend}
#'     \item{"color"}{ : color of legend icon (if shape is not given)}
#'     \item{"shape"}{ : svg icon to display for the event type}
#' }
#' @param legend.columns How many columns should the legened entries be split across. Default to 1
#' @param background.image URL for a .png image to be shown as the background for eventsObserver, this must be an external URL. Default to FALSE, an error will be returned if \code{RCurl::url.exists(background.image)} fails.
#' @import htmlwidgets
#' @return 
#' A HTML widget object
#' 
#' @examples
#' ## Visualise events on places equally distributed around a circle
#' eventsObserveR(events = sample_events_data,
#' place.key = "station")
#'
#' ## Visualise events on places specified by the sample_locations_data
#' eventsObserveR(events = sample_events_data, 
#' place.key = "station",
#' places = sample_locations_data)
#' 
#' @export
eventsObserveR <- function(events, 
                          places = NULL, 
                          place.key = "place",
                          periodsPerSecond = 24,
                          period = 1,
                          previousPeriodDuration = 1,
                          period.unit = "days",
                          previous.period.unit = "days",
                          size = list(
                            view.width = 700,
                            view.height = 600,
                            interface.width = 1024, 
                            interface.height = 786,
                            horizontal.margin = 100,
                            vertical.margin = 100
                          ),
                          place.radius = NULL,
                          shape.type = "circle",
                          event.radius = 5,
                          place.color = "lavenderblush",
                          event.color = "red",
                          legend = FALSE,
                          legend.columns = 1,
                          background.image = FALSE
                          ) {
  
  # coerce the times into milliseconds
  # TODO: Apply logic more sensibly and provide errors
  events$time <- as.integer(events$time) * 1000

  # mutate(time = as.integer(time) * 1000)
  
  ## Convert image to base64 per https://github.com/ox-it/eventsObserveR/issues/17
  if(background.image != FALSE){
    background.image <- base64enc::dataURI(
      # note: this works with local also
      # note: dataURI also works with RAW content so pairs nicely with magick
      file = background.image,
      mime = "image/png"
    )
  }
  
  # create a list that contains the settings
  settings <- list(
    periods_per_second = periodsPerSecond,
    period = period,
    previous_period_duration = previousPeriodDuration,
    period_unit = period.unit,
    previous_period_unit = previous.period.unit,
    places = places,
    place_key = place.key,
    view_width = size$view.width,
    view_height = size$view.height,
    interface_width = size$interface.width,
    interface_height = size$interface.height,
    horizontal_margin = size$horizontal.margin,
    vertical_margin = size$vertical.margin,
    place_radius = place.radius,
    shape_type = shape.type,
    event_radius = event.radius,
    place_color = place.color,
    event_color = event.color,
    legend = legend,
    legend_columns = legend.columns,
    background_image = background.image
  )
  
  # pass the data and settings using 'x'
  x <- list(
    events = events,
    settings = settings
  )
  
  # create the widget
  htmlwidgets::createWidget("eventsObserveR", 
                            x,
                            width = size$interface.width,
                            height = size$interface.height
                            # Using default htmlwidget sizingPolicy for time being
                            # sizingPolicy = htmlwidgets::sizingPolicy(
                            #   browser.fill = TRUE,
                            #   browser.padding = 75
                            # )
                            )
  
}

b64img <- function(img_url){
  base64enc::dataURI(
  # note: this works with local also
  # note: dataURI also works with RAW content so pairs nicely with magick
  file = img_url,
  mime = "image/png"
)
}

