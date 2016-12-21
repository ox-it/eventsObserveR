## The initial dataset that inspired this library is sensitive, containing the locations of rare wild animals.
## In the interested of replicability, the process of jittering the data points to random locations has been preserved.
## Additionally a set of randomly selected animal names is included in data-raw but is no longer an active part of this codebase.

load("data/sample_events_data")
load("data/sample_locations_data")
library(spatstat)
new_point_coords <- rjitter(ppp(scales::rescale(sample_locations_data$x, to = c(0, 1)), scales::rescale(sample_locations_data$y, to = c(0, 1))), radius = 0.432) %>%
  as.data.frame() %>%
  mutate(x = round(100*x),
         y = round(100*y))

sample_locations_data$x <- new_point_coords$x
sample_locations_data$y <- new_point_coords$y

save(sample_events_data, file = "data/sample_events_data.rdata")
save(sample_locations_data, file = "data/sample_locations_data.rdata")
