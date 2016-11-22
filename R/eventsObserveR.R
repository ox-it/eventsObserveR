#' @import htmlwidgets
#' @export
eventsObserveR <- function(events, 
                          places = NULL, 
                          place.key = "place",
                          periodsPerSecond = 24,
                          period = 86400,
                          previousPeriodDuration = 86400,
                          size = list(
                            view.width = 700,
                            view.height = 500,
                            interface.width = 1024, 
                            interface.height = 786
                          )) {
  
  # create a list that contains the settings
  settings <- list(
    periods_per_second = periodsPerSecond,
    period = period,
    places = places,
    place_key = place.key,
    view_width = size$view.width,
    view_height = size$view.height,
    interface_width = size$interface.width,
    interface_height = size$interface.height,
    previous_period_duration = previousPeriodDuration 
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
                            height = size$interface.height,
                            sizingPolicy = htmlwidgets::sizingPolicy(
                              browser.fill = TRUE,
                              browser.padding = 75
                            ))
  
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