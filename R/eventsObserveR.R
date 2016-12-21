#' eventsObserver
#' 
#' \code{eventsObserveR} creates an playable visualisation of the distribution of event observations over a range of defined places within a variable time period.
#' 
#' @param events A data.frame with events, needs at least place.key, time and place_id
#' \itemize{
#'   \item{place.key}{place.key, unique identifier for each observation used which must be set as place.key.}
#'   \item{time}{time, when the event was observed, in as.POSIXct format.}
#'   \item{radius}{radius, size of event when displayed.}
#'   \item{color}{color, color for the event}
#'   \item{place_id}{placed_id, id of the location (place) where the event was observed. Must be given if `places` is not NULL.}
#'  }
#'  
#' @param places An optional data.frame for place locations, if NULL places will be set to fill outline a circle that fills the available space. Default to NULL
#' \itemize{
#'   \item{id}{id, Unique id for each location, ranging from 0 - 98. Note that these ids correspond to the `place_id` in `sample_events_data`}
#'   \item{x}{x, x coordinate of each locations}
#'   \item{y}{y, y coordinate of each locations}
#'   \item{color}{color, color of each location}
#'   \item{radius}{radius, radiues of each location}
#'   \item{title}{title, tooltip text displayed when hovering over the location}
#'  }
#' @param place.key Name of column containing place.key in the events data.frame (defaults to place).
#' @param periodsPerSecond Equivalent to number of "frames per second when playing" the eventsObserver animation. Default 24.
#' @param period Period within which events must occur to be displayed as filled dots. Default to 86400 seconds.
#' @param period.unit Unit (seconds, hours, days) used to calculate the length of the `period`. Default to "days".
#' @param previousPeriodDuration Period within which events occuring prior to "period" will be included in the visualisation and displayed as empty dots. Default to 86400 seconds.
#' @param previous.period.unit Unit (seconds, hours, days) used to calculate the length of the `previous.period`. Default to "days".
#' @param size Optional list of named arguments:
#' \itemize{
#'  \item{"place"}{ : unique "place" id, does not need to be numeric}
#'  \item{"time"}{ : integer time of event, cannot be as.POSIXct}
#'  \item{"title"}{ : tooltip of the event}
#'  \item{...}{}
#'  }
#' @param place.radius Radius for circles representing locations for events, used only if `places` is not NULL. Otherwise the radius column in `places` is used.
#' @param shape.type Type of shape to use for events, defaults to "circle". Can be path to svg images.
#' @param event.radius Radius for events, default to 5. Only used if a column called "radius" in `events` is not given.
#' @param event.color Color of events, only used if a column called "color" is not given in `events`. Default is "red".
#' @param place.color Color for places, default to "lavenderblush". Only used if a column called "color" in `places` is not given.
#' @param legend An optional data.frame for legend labelling events by type. Default to NULL
#' \itemize{
#'     \item{"description"}{ : unique "place" id, does not need to be numeric}
#'     \item{"color"}{ : }
#' }
#' @param legend.columns How many columns should the legened entries be split across. Default to 1
#'  
#' @import htmlwidgets
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
                            view.width = 600,
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
                          legend = NULL,
                          legend.columns = 1) {
  # coerce the times into milliseconds
  # TODO: Apply logic more sensibly and provide errors
  events$time <- as.integer(events$time) * 1000

  # mutate(time = as.integer(time) * 1000)
  
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
    legend_columns = legend.columns
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

#' eventsObserverOutput
#' 
#' Use \code{eventsObserverOutput()} to create a UI element, and \code{renderEventsObserver()} to render the eventsObserveR widget.
#' 
#' @param outputId output variable to read from
#' @param width width of eventsObserveR
#' @param height height of eventsObserveR
#' @export
eventsObserverOutput <- function(outputId, width = "100%", height = "400px") {
  shinyWidgetOutput(outputId, "eventsObserveR", width, height, package = "eventsObserveR")
}

#' renderEventsObserver
#' 
#' Use \code{eventsObserverOutput()} to create a UI element, and \code{renderEventsObserver()} to render the eventsObserveR widget.
#' 
#' @param expr Call to eventsObserveR that generates a eventsObserveR class object that can be rendered client-side using eventsObserveROutput
#' @param env The environment in which to evaluate expr.
#' @param quoted Is expr a quoted expression (with quote())? This is useful if you want to save an expression in a variable.
#' 
#' @export
renderEventsObserver <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  shinyRenderWidget(expr, eventsObserverOutput, env, quoted = TRUE)
}