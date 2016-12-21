sample_events_data <- emre_data %>%
  select(time, Species, radius, color, place_id, title, station)
colnames(sample_events_data) <- tolower(colnames(sample_events_data))

# load("data/sample_events_data.rdata")
# load("data/sample_locations_data.rdata")

random_animal_names <- read_csv("data-raw/random-animal-names.csv")

unique_species <- sample_events_data %>%
  select(species) %>%
  unlist(use.names = FALSE) %>%
  trimws() %>%
  unique()

sample_events_data <- sample_events_data %>%
         mutate(species = mapvalues(species, from = unique_species,
                             to = sample(random_animal_names$name, length(unique_species))))

new_point_coords <- rjitter(ppp(scales::rescale(sample_locations_data$x, to = c(0, 1)), scales::rescale(sample_locations_data$y, to = c(0, 1))), radius = 0.432) %>%
  as.data.frame() %>%
  mutate(x = round(100*x),
         y = round(100*y))

sample_locations_data$x <- new_point_coords$x
sample_emre_locations$y <- new_point_coords$y

# sample_locations_data <- sample_emre_locations

sample_events_data <- sample_events_data %>%
  select(-title)

# sample_events_data <- sample_events_data %>%
#   select(-radius)

sample_events_data <- sample_events_data %>%
  # rename(event_type = species) %>%
  mutate(event_type_id = as.numeric(mapvalues(
    event_type,
    from = unique(event_type),
    to = 0:{
      length(unique(event_type)) - 1
    }
  ))) %>% 
  mutate(title = event_type)
  
save(sample_events_data, file = "data/sample_events_data.rdata")
save(sample_locations_data, file = "data/sample_locations_data.rdata")
