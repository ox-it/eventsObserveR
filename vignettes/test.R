library(tidyverse)
library(lubridate)
library(viridis)
emre_data <- read.csv("http://users.ox.ac.uk/~oucs0030/temp/FOQMRuVAifoTmfWMDgsz6a.csv", stringsAsFactors = F)


unique_species <- emre_data %>%
  select(Species) %>%
  unique() %>%
  unlist(use.names = F)

emre_data <- emre_data %>%
  mutate(station_id = plyr::mapvalues(Camera.ID, from = unique_species, to = 1:length(unique_species)))

emre_data <- emre_data %>%
  mutate(species_id = plyr::mapvalues(Species, from = unique_species, to = 1:length(unique_species)))

emre_data <- emre_data %>%
  mutate(station = gsub("_Camera_[A-Z]", "", Camera.ID))

emre_data <- emre_data %>%
  mutate(time = dmy_hms(paste(Date,Time)))

emre_data <- emre_data %>%
  mutate(radius = rep(5, nrow(emre_data)))

htmlwidgets::HTMLWidgets.dataframeToD3(emre_data)

emre_data <- emre_data %>%
  mutate(time = as.integer(time) * 1000)

emre_data <- emre_data %>%
  mutate(color = plyr::mapvalues(Species, from = unique_species, to = viridis::viridis(length(unique_species)))) %>% # chrome doesn't suppport 8 character hex colors (yet) but Firefox does
  mutate(color = substr(color,1,nchar(color)-2))

emre_data <- emre_data %>%
  filter(!Species %in% c("Humans with or without domestic animals", "Humans", "Domestic animals", ""))

eventsObserveR(events = emre_data, place.key = "station")
