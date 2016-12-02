#' eventsObserver
#' 
#' \code{eventsObserveR} creates an playable visualisation of the distribution of event observations over a range of defined places within a variable time period.
#' 
#' @param events A data.frame with events, needs at least place.key, time
#' \itemize{
#'  \item{"place"}{ : unique "place" id, does not need to be numeric}
#'  \item{"time"}{ : integer time of event, cannot be as.POSIXct}
#'  \item{"title"}{ : tooltip of the event}
#'  \item{...}{}
#'  }
#' @param places An optional data.frame for place locations, if NULL places will be set to fill outline a circle that fills the available space. Default to NULL
#' \itemize{
#'  \item{"place"}{ : unique "place" id, does not need to be numeric}
#'  \item{"time"}{ : integer time of event, cannot be as.POSIXct}
#'  \item{"title"}{ : tooltip of the event}
#'  \item{...}{}
#'  }
#' @param place.key Name of column containing place.key in the events data.frame (defaults to place).
#' @param periodsPerSecond Equivalent to number of "frames per second when playing" the eventsObserver animation. Default 24.
#' @param period Period within which events must occur to be displayed as filled dots. Default to 86400 seconds.
#' @param previousPeriodDuration Period within which events occuring prior to "period" will be included in the visualisation and displayed as empty dots. Default to 86400 seconds.
#' @param size Optional list of named arguments:
#' \itemize{
#'  \item{"place"}{ : unique "place" id, does not need to be numeric}
#'  \item{"time"}{ : integer time of event, cannot be as.POSIXct}
#'  \item{"title"}{ : tooltip of the event}
#'  \item{...}{}
#'  }
#'  
#' @import htmlwidgets
#' @export
eventsObserveR <- function(events, 
                          places = NULL, 
                          place.key = "place",
                          periodsPerSecond = 24,
                          period = 86400,
                          previousPeriodDuration = 86400,
                          size = list(
                            view.width = 600,
                            view.height = 600,
                            interface.width = 1024, 
                            interface.height = 786,
                            horizontal.margin = 100,
                            vertical.margin = 100
                          ),
                          place.radius = NULL,
                          event.radius = 5,
                          place.color = "lavenderblush",
                          event.color = "red",
                          legend = NULL,
                          legend.columns = 1) {
  
  # create a list that contains the settings
  settings <- list(
    periods_per_second = periodsPerSecond,
    period = period,
    previous_period_duration = previousPeriodDuration,
    places = places,
    place_key = place.key,
    view_width = size$view.width,
    view_height = size$view.height,
    interface_width = size$interface.width,
    interface_height = size$interface.height,
    horizontal_margin = size$horizontal.margin,
    vertical_margin = size$vertical.margin,
    place_radius = place.radius,
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

#' @export
eventsLegend <- function(eventsObserver = eO,
                         legend.data = NULL,
                         columns = 1){
  # Add the legend to the eventsObserver
  
  if(is.null(legend.data)){
    "kens_auto_legend"
  } else {
    "specified_appearance_legend"
  }
}

#' @export
eventsObserverOutput <- function(outputId, width = "100%", height = "400px") {
  shinyWidgetOutput(outputId, "eventsObserveR", width, height, package = "eventsObserveR")
}
#' @export
renderEventsObserver <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  shinyRenderWidget(expr, eventsObserverOutput, env, quoted = TRUE)
}