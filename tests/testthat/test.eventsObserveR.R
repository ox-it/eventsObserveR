test_that(
  "eventsObserveR(events = sample_events_data,
  place.key = 'station') makes an eventsObserveR object",
  {
    eO <- eventsObserveR(events = sample_events_data,
                         place.key = "station")
    
    expect_true(all(class(eO) %in% c("eventsObserveR",  "htmlwidget")))
    
  }
  )


## Shiny


# foo <- shinyApp(
#   ui = fluidPage(
#     eventsObserverOutput("eObserver")
#   ),
#   server = function(input, output){
#     output$eObserver <- renderEventsObserver(
#       eventsObserveR(events = sample_events_data,
#                      place.key = "station")
#     )
#   }
# )
#
# class(foo)

test_that("renderEventsObserver returns a function", {
  expect_true(is.function(renderEventsObserver(
    eventsObserveR(events = sample_events_data,
                   place.key = "station")
  )))
  
})



test_that("eventsObserverOutput returns a function", {
  
  expect_true(
    all(class(eventsObserverOutput("outputid")) %in% c("shiny.tag.list", "list"))
  )
  
})
