#' @import htmlwidgets
#' @export
animateEvents <- function(events, places, 
                          periodsPerSecond = 24,
                          period = 86400,
                          previousPeriodDuration = 86400,
                          width = NULL,
                          height = NULL) {
  
  # read the gexf file
  data <- paste(readLines(gexf), collapse="\n")
  
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