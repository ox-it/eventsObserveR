# library(tidyverse)
# library(lubridate)
# library(viridis)
# emre_data <- read.csv("http://users.ox.ac.uk/~oucs0030/temp/FOQMRuVAifoTmfWMDgsz6a.csv", stringsAsFactors = F)
# 
# 
# unique_species <- emre_data %>%
#   select(Species) %>%
#   unique() %>%
#   unlist(use.names = F)
# 
# emre_data <- emre_data %>%
#   mutate(station_id = plyr::mapvalues(Camera.ID, from = unique_species, to = 1:length(unique_species)))
# 
# emre_data <- emre_data %>%
#   mutate(species_id = plyr::mapvalues(Species, from = unique_species, to = 1:length(unique_species)))
# 
# emre_data <- emre_data %>%
#   mutate(station = gsub("_Camera_[A-Z]", "", Camera.ID))
# 
# emre_data <- emre_data %>%
#   mutate(time = dmy_hms(paste(Date,Time)))
# 
# emre_data <- emre_data %>%
#   mutate(radius = rep(5, nrow(emre_data)))
# 
# # 
# # emre_data <- emre_data %>%
# #   mutate(time = as.integer(time) * 1000)
# 
# emre_data <- emre_data %>%
#   mutate(color = plyr::mapvalues(Species, from = unique_species, to = viridis::viridis(length(unique_species)))) %>% # chrome doesn't suppport 8 character hex colors (yet) but Firefox does
#   mutate(color = substr(color,1,nchar(color)-2))
# 
# emre_data <- emre_data %>%
#   filter(!Species %in% c("Humans with or without domestic animals", "Humans", "Domestic animals", ""))
# 
# 
# legend.df <- emre_data %>%
#   select(Species, color) %>%
#   rename(description = Species) %>%
#   unique()
# 
# ## === Subcounts
# ## === 
# 
# subcount_cols <- colnames(emre_data)[grepl("No..", colnames(emre_data))]
# ## Make label if subcount not NA
# subcount_label <- function(i_row, column){
#   if(!is.na(i_row[, column])){
#     paste(i_row[, column], column) 
#   }
# }
# ## Combine subcounts to form title
# title <- as.character()
# # for(i in 1:nrow(emre_data)){
# #   i_row <- emre_data[i, subcount_cols]
# #   # subcount_label(subcount_cols["1"]) %>% print()
# #   
# #   this_title <- lapply(subcount_cols, function(x)subcount_label(i_row, x))
# #   this_title <- this_title[!sapply(this_title, is.null)] %>%
# #     gsub("[.][.]", ". ", .) %>% 
# #     gsub("No[.] ", "", .) %>%
# #     paste(collapse = ", ")
# # 
# #   title <- append(title, this_title)
# # }
# 
# my_rows <- lapply(1:nrow(emre_data), function(x)emre_data[x,] %>% as.list())
# 
# i_row <- i_row[!is.na(i_row)]
# 
# paste0(names(my_rows), ": ", my_rows, collapse = ", ")
# 
# ## Add titles into emre_data
# emre_data$title <- title
# 
# # emre_data <- emre_data %>%
# #   mutate(title = paste(No..Individuals, Species, Camera.ID, time))
# 
# 
# emre_locations <- read_csv("http://users.ox.ac.uk/~oucs0030/temp/Locations-FOQMRuVAifoTmfWMDgsz6a.csv")
# head(emre_locations)
# 
# emre_locations <- emre_locations %>%
#   mutate(id = `station no` - 1) %>%
#   rename(x = `x coordinate`,
#          y = `y coordinate`,
#          station.no = `station no`)
# 
# setdiff(1:max(emre_locations$id), emre_locations$id)
# 
# 
# no_empties <- setdiff(1:max(emre_locations$id), emre_locations$id)
# empties <- data.frame(
#   id = no_empties,
#   x = rep(0, length(no_empties)),
#   y = rep(0, length(no_empties)),
#   station.no = no_empties + 1
# )
# 
# all_locations <- full_join(emre_locations, empties) %>%
#   arrange(station.no)
# all_locations <- all_locations %>%
#   mutate(color = rep("pink", nrow(all_locations)),
#          radius = 10,
#          title = paste("Station", station.no))
# 
# all_locations %>%
#   filter(station.no %in% {no_empties + 1})
# 
# emre_data %>%
#   filter(Camera.ID %in% {no_empties + 1})
# 
# emre_data <- emre_data %>%
#   mutate(place_id = as.numeric(gsub("Station_", "", station)) - 1)
# 
# 
# emre_data$title <- emre_data$Camera.ID
# 
# str(emre_data)
# 
# eventsObserveR(events = emre_data, 
#                place.key = "station",
#                places = all_locations,
#                legend = legend.df,
#                legend.columns = 2,
#                size = list(
#                  view.width = 1040,
#                  view.height = 720,
#                  interface.width = 1200, 
#                  interface.height = 900))
# 
# 
# 
# 
# 
