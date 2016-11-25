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