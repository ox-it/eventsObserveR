#' Wrapper functions for using \pkg{leaflet} in \pkg{shiny}
#' 
#' Use \code{eventsObserverOutput()} to create a UI element, and \code{renderEventsObserver()}
#' to render the map widget.

#' @rdname map-shiny
#' @inheritParams htmlwidgets::shinyWidgetOutput
#' @param width,height the width and height of the eventsObserver (see
#'   \code{\link[htmlwidgets]{shinyWidgetOutput}})
#'
#' @export
#' @examples
#' \dontrun{library(eventsObserveR)
#' library(shiny)
#' app = shinyApp(
#'   ui = fluidPage(eventsObserverOutput('eObserver')),
#'   server = function(input, output) {
#'     output$eObserver = renderEventsObserver(eventsObserveR(events = sample_events_data,
#' place.key = "station"))
#'   }
#' )
#'
#' if (interactive()) print(app)}
renderEventsObserver <- function(expr, env = parent.frame(), quoted = FALSE) {
if (!quoted) { expr <- substitute(expr) } # force quoted
shinyRenderWidget(expr, eventsObserverOutput, env, quoted = TRUE)
}

#' @rdname map-shiny
#' @export
eventsObserverOutput <- function(outputId, width = "100%", height = "400px") {
  shinyWidgetOutput(outputId, "eventsObserveR", width, height, package = "eventsObserveR")
}
