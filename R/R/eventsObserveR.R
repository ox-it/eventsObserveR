#' @import htmlwidgets
#' @export
animateEvents <- function(events, 
                          places, 
                          periodsPerSecond = 24,
                          period = 86400,
                          previousPeriodDuration = 86400,
                          width = NULL,
                          height = NULL) {
  
  # create a list that contains the settings
  settings <- list(
    periodsPerSecond = periodsPerSecond,
    period = period,
    previousPeriodDuration = previousPeriodDuration 
  )
  
  # pass the data and settings using 'x'
  x <- list(
    events = events,
    places = places,
    settings = settings
  )
  
  # create the widget
  htmlwidgets::createWidget("animateEvents", 
                            x,
                            width = width,
                            height = height)
}

#' @export
animateEventsOutput <- function(outputId, width = "100%", height = "400px") {
  shinyWidgetOutput(outputId, "animateEvents", width, height, package = "animate_movement")
}
#' @export
renderAnimateEvents <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  shinyRenderWidget(expr, animateEventsOutput, env, quoted = TRUE)
}