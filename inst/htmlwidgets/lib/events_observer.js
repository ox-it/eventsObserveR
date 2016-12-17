// Developed by Ken Kahn and Martin Hadley of IT Services, University of Oxford
// copyright??

function create_event_animator(element) {
	// interface for HTMLWidgets in R
	var widget;
	return {initialise: function (events, options) {
	                        element.innerHTML = "";
							widget = animate_events(events, options, element);
	                    },
	        refresh: function () {
	        	         widget.refresh();
	                 },
	        resize:  function (new_width, new_height) {
						 widget.resize(new_width, new_height);
	                 },
	        // add_legend interface exposed in case htmlwidget wants to add legend after initialisation
	        add_legend: function (legend, legend_columns) {
	        	            widget.add_legend(legend, legend_columns);
	                    }
	       };
};

function animate_events(events, options, element) {
	// events should be an array of objects with
	//   event_type_id (a number between 0 and one less than the number of unique event types),
	//   time (a JavaScript Date object) or an integer corresponding to the number milliseconds since 1 January, 1970.
	// and optionally
	//   radius, color, title, and any other fields
	// options include:
	//   places (an array of objects with properties x, y, id, color, radius
	//           where x and y are pixel coordinates (transformed to fit the viewing area) and
	//           id matches the place_id of events)
	//   place_key (a string corresponding to a field in the events -- )
	//   view_width and view_height which specify the size of the visualisation area in pixels
	//   interface_width and interface_height which specify the size of the entire interface (including controls and legends) in pixels
	//   period those events with this period are displayed (given in seconds)
	//   previous_period_duration those events just prior to now that are displayed when paused (given in seconds)
	//   periods_per_second the desired rate at which periods are displayed (periods ("frames") per second) -- browsers might not be capable of supporting high values (e.g. over 60)
	//   horizontal_margin and vertical_margin space around the view of the places needed for displaying circles around places (in pixels)
	//   place_color if places do not specify a color then this value is used
	//   event_color if events do not specify a color then this value is used
	//   place_radius radius of place circles
	//   event_radius radius of events if not explicitly provided
	//   legend an array of objects with color and description keys
	//   legend_columns the number of columns to display the legend

	if (!options) {
		options = {};
	}
	if (!element) {
		element = document.body;
	}
	var places                   = options.places; // can be undefined so long as options.place_key is defined
	var view_width               = options.view_width                    ||  700;
	var view_height              = options.view_height                   ||  500;
	var interface_width          = options.width                         || 1024;
	var interface_height         = options.height                        ||  786;
	var periods_per_second       = options.periods_per_second            ||   24;
	var period                   = options.period                        || 24*60*60; // in seconds
	var legend_columns           = options.legend_columns                ||    2;
	var previous_period_duration = typeof options.previous_period_duration === 'number' ? options.previous_period_duration : period;

	var paused            = true;
	var play_direction    = 1; // forward one period
	var formatDateInput   = d3.timeFormat("%Y-%m-%d");
	var inactive_event_types = [];
	var shape_type;

	var process_places = function () {
		var place_names = [];
		var place_key = options.place_key || "place";
		var horizontal_margin = options.horizontal_margin || 100;
	    var vertical_margin   = options.vertical_margin   || 100;
		var compute_place = function (place_name, index) {
	       var theta = 2 * Math.PI / place_names.length;
	       var rotation = -Math.PI / 2; // so the first place is at 12 o'clock
	       var place_color        = options.place_color       || 'pink';
	       var ellipse_width      = view_width /2-horizontal_margin;
	       var ellipse_height     = (view_height/2-vertical_margin);
	       var ellipse_circumference = 2 * Math.PI * Math.sqrt((ellipse_width * ellipse_width + ellipse_height * ellipse_height) / 2);
	       var radius             = options.place_radius || ellipse_circumference / (2 * place_names.length);
           return {x:      ellipse_width  * Math.cos(index * theta + rotation) + view_width/2,
                   y:      ellipse_height * Math.sin(index * theta + rotation) + view_height/2,
                   radius: radius,
		           color:  place_color,
		           id:     index,
		           title:  place_name};
	    };
	    var max_place_x = 0;
	    var max_place_y = 0;
	    var x_factor, y_factor;
		events.forEach(function (event) {
			if (event[place_key] && place_names.indexOf(event[place_key]) < 0) {
				place_names.push(event[place_key]);
			}
		});
		if (place_names.length === 0) {
			alert("Error: a place_key used in the events needs to be provided unless the key is 'place' in the event data.");
			return;
		};
		if (places) {
			places.forEach(function (place) {
				if (place.x > max_place_x) {
					max_place_x = place.x;
				}
				if (place.y > max_place_y) {
					max_place_y = place.y;
				}
			});
			x_factor = (view_width -2*horizontal_margin)/max_place_x;
			y_factor = (view_height-2*vertical_margin)  /max_place_y;
			for (i = 0; i < places.length; i++) {
				if (places[i]) {
					places[i].x = horizontal_margin+(places[i].x*x_factor);
					// view_height is here because in the browser increasing y is downward
					places[i].y = -vertical_margin+view_height-(places[i].y*y_factor);
				} else {
					// missing places still need entries even though they'll never be seen
					places[i] = {x: 0,
								 y: 0,
								 radius: 0,
								 color: "white",
								 id: i};
				}
			};
		} else {
		    places = place_names.map(compute_place);
			events.forEach(function (event) {
				event.place_id = place_names.indexOf(event[place_key]);
			});
		}
	};

	var coordinates_from_place = function () {
		events.forEach(function (event) {
			var place = places[event.place_id];
			if (typeof event.x !== 'number') {
				// true_x is where the event's place is located
				event.true_x = place.x;
				// x is where it should be displayed
				event.x      = place.x;
			}
			if (typeof event.y !== 'number') {
				event.true_y = place.y;
				event.y = place.y;
			}
		});
	};

	var add_css = function () {
		var style = document.createElement('style');
		style.textContent =
"button {" +
"	font-size: 1.2em;" +
"	border-radius: 6px;" +
"   background-color: #fece2f;" +
"	cursor: pointer;" +
"}" +
".event-replay-button, .event-number-input, .event-date-input, .event-unit-select {" +
"	font-family: Segoe UI,Arial,sans-serif;" +
"	font-weight: bold;	" +
"	font-size: 1em;" +
"	border-radius: 6px;" +
"   width: 8ch;" +
"}" +
".event-date-input {" +
"   width: 16ch;" +
"}" +
".event-unit-select {" +
"   width: 13ch;" +	/* wider than needed since IE11 puts the selector on the end */
"}" +
".event-text {" +
"	font-family: Segoe UI,Arial,sans-serif;" +
"	font-size: 1.1em;" +
"	font-weight: bold;	" +
"}" +
".event circle {" +
"    stroke-width: 1.5px;" +
"}" +
".event-legend, .event-view-and-controls {" +
"	display: inline-block;" +
"	vertical-align: top;" +
"}" +
".event-legend-description {" +
"	padding-right: 16px;" +
"}" +
".event-key-inactive {" +
"	opacity: .1;" +
"	cursor: pointer;" +
"}" +
".event-key-active {" +
"	opacity: 1;" +
"	cursor: pointer;" +
"}";
       document.head.appendChild(style);
   };

   var refresh = function () {
       var end_time = earliest_day;
       var events_from_this_period = [];
       var locations_to_events = [];
       var spreadout_events_with_the_same_location = function () {
       	   var event;
       	   if (events_from_this_period.length < 1) {
       	  	   return;
       	   }
	       if (events_from_this_period.length < 2) {
	           event = events_from_this_period[0];
			   event.x = event.true_x;
		  	   event.y = event.true_y;
			   return;
		   }
		   Object.keys(locations_to_events).map(function (key) {
			   if (locations_to_events[key].length > 1) {
			  	   spreadout(locations_to_events[key]);
			   } else {
			  	   event = locations_to_events[key][0];
			  	   event.x = event.true_x;
		  	  	   event.y = event.true_y;
			   }
			  });
		};
		var spreadout = function (events_at_same_place) {
		  	var circumference = 0;
		  	var radius = 0;
		  	var arc_length = 0;
		    var event_radius = options.event_radius || 5;
		  	events_at_same_place.forEach(function (event) {
		  	    circumference += (event.radius || event_radius)*2;
		  	});
		  	radius = circumference / (2 * Math.PI);
		  	events_at_same_place.forEach(function (event) {
		  	    // fraction of the circle to the center of the current circle
		  	    var angle = (arc_length+(event.radius || event_radius)) * 2 * Math.PI / circumference;
		  	  	event.x = event.true_x + radius * Math.cos(angle);
		  	    event.y = event.true_y + radius * Math.sin(angle);
		  	  	arc_length += (event.radius || event_radius)*2;
		  	});
		};
		var add_event_to_others_this_period = function (event) {
		    events_from_this_period.push(event);
			if (locations_to_events[event.place_id]) {
			    locations_to_events[event.place_id].push(event);
			} else {
			    locations_to_events[event.place_id] = [event];
		    }
		};
	    events.forEach(function (event, index) {
						   if (event.time > end_time) {
							   spreadout_events_with_the_same_location();
							   end_time += period*1000;
							   events_from_this_period = [];
							   locations_to_events = [];
						   }
						   if (inactive_event_types.indexOf(event.color) < 0) {
							   add_event_to_others_this_period(event);
						   }
			          });
    };

    var now; // displays events >= now and less than now+period*1000

    var current_period = function (time) {
  	    return time >= now &&
      	       time <  now+1000*period;
    };

    var previous_period = function (time) {
  	    return paused && // only display previous period events if paused
  	           time >= now-previous_period_duration*1000 &&
      	       time <  now;
    };

    var update = function () {
  	  // move current_period's and previous_period's event sightings into view and move others out
  	  var date = new Date(now);
  	  var coordinate = function (d, x_or_y) {
  	  	  // should replace d.color with d.event_type_id after updating inactive_event_types
  	  	  if (inactive_event_types.indexOf(d.color) >= 0) {
       	      return -1000;
       	  }
		  if (current_period(d.time) || previous_period(d.time)) {
			  return d[x_or_y];
		  }
		  return -1000; // offscreen
  	  };
	  // if integer number of days then just display the date otherwise the date and time
	  d3.select(time_display).text(period >= 24*60*60 && period%(24*60*60) === 0 ? date.toLocaleDateString() : date.toLocaleString());
      if (shape_type === 'circle') {
      	  nodes
      	    .attr("cx",     function (d) { return coordinate(d, 'x') })
            .attr("cy",     function (d) { return coordinate(d, 'y') })
      	    .attr("fill",   function (d) {
							    if (previous_period(d.time)) {
								    return 'white';
							    }
							    return d.color;
						    })
	        .attr("stroke", function (d) {
							    if (previous_period(d.time)) {
								    return d.color;
							    }
							    return 'white';
						    })
						    	    // current_period's are solid coloured circles with a white border and yesterday's are white with a coloured border
	       .attr("r",     function (d) {
							  return d.radius;
						  });
      } else {
      	 nodes
      	   .attr("x",       function (d) { return coordinate(d, 'x')-d.radius })
           .attr("y",       function (d) { return coordinate(d, 'y')-d.radius })
      	   .attr("opacity", function (d) {
							    if (previous_period(d.time)) {
								    return .25;
							    }
							    return 1;
						    });
      }
    };

    var tick = function() {
	  update();
	  if (paused) {
	  	  return;
	  }
      now += play_direction*period*1000;
      if (now < start_date || now < earliest_day) {
      	  now = Math.max(earliest_day, start_date);
      	  paused = true; // reached the start date playing in reverse
      	  update();
      	  return;
      }
      if (now <= latest_time &&
          now <= end_date) {
    	  setTimeout(tick, 1000/periods_per_second);
      } else {
      	  // since got the end of the log
      	  now = Math.min(latest_day, end_date);
      	  paused = true;
      	  update();
      }
    };

    var view_and_controls = document.createElement('table');

    var add_to_view_and_controls = function (element) {
	  var row   = document.createElement('tr');
	  var entry = document.createElement('td');
	  entry.appendChild(element);
	  row.appendChild(entry);
	  view_and_controls.appendChild(row);
    };

    var add_play_buttons = function () {
  	  var forward          = document.createElement('button');
  	  var backward         = document.createElement('button');
  	  var pause            = document.createElement('button');
  	  var step_forward     = document.createElement('button');
  	  var step_backward    = document.createElement('button');
  	  var faster           = document.createElement('button');
  	  var slower           = document.createElement('button');
  	  var space            = document.createElement('span');
  	  var space2           = document.createElement('span');
  	  var space3           = document.createElement('span');
  	  var period_input     = document.createElement('span');
  	  var previous_period  = document.createElement('span');
  	  var start_date_input = document.createElement('span');
  	  var end_date_input   = document.createElement('span');
  	  var br               = document.createElement('br');
  	  var forward_action   =    function () {
								     play_direction = 1;
								     if (paused) {
								     	 paused = false;
								     	 tick();
								     }
						         };
	  var backward_action   =    function () {
	  	                             play_direction = -1;
								     if (paused) {
								     	 paused = false;
								     	 tick();
								     }
						         };
	  var pause_action =         function () {
								     paused = true;
								     update();
							     };
	  var step_forward_action =  function () {
	                                 now += period*1000;
	                                 update();
	                             };
	  var step_backward_action = function () {
	                                 now -= period*1000;
	                                 update();
	                             };
	  var faster_action        = function () {
	  	                             periods_per_second *= Math.sqrt(2);
	  	                             update_faster_title();
	  	                             if (paused) {
	  	                             	 paused = false;
	  	                             	 tick();
	  	                             }
	                             };
      var slower_action        = function () {
	  	                             periods_per_second /= Math.sqrt(2);
	  	                             update_slower_title();
	  	                             if (paused) {
	  	                              	 paused = false;
	  	                            	 tick();
	  	                             }
	                              };
	  var update_faster_title = function () {
	  	  faster.title = "Speed is " + periods_per_second.toPrecision(4) + " periods per second. Click to go faster.";
	  };
	  var update_slower_title = function () {
	  	  slower.title = "Speed is " + periods_per_second.toPrecision(4) + " periods per second. Click to go slower.";
	  };
	  var add_legend = function (legend_data, columns) {
	  	  entire_interface.appendChild(create_legend(legend_data, columns));
	  };
	  var create_legend = function (legend_data, columns) {
	  	  var table = document.createElement('table');
	  	  var create_button = function (label) {
	  	  	  var button = document.createElement('button');
	  	  	  button.innerHTML = '<b class="event-replay-button">' + label + '</b>';
	  	  	  return button;
	  	  };
	  	  var select_all   = create_button('Select all');
	  	  var deselect_all = create_button('Deselect all');
	  	  var keys = [];
	  	  var row, td;
	  	  select_all  .addEventListener('click',
	  	                                function () {
	  	                                	inactive_event_types = [];
	  	                                	keys.forEach(function (key) {
	  	                                		key.className = "event-key-active";
	  	                                	});
	  	                                	refresh();
	  	  	                       	        update();
	  	  	                       	    });
	  	  deselect_all.addEventListener('click',
	  	                                function () {
	  	                                	inactive_event_types = legend_data.map(function (entry) {
	  	                                	                                           return entry.color;
	  	                                										   });
	  	                                    keys.forEach(function (key) {
	  	                                        key.className = "event-key-inactive";
	  	                                	});
	  	                                	refresh();
	  	  	                       	        update();
	  	  	                       	    });
	  	  row = document.createElement('tr');
	  	  td  = document.createElement('td');
	  	  td.appendChild(select_all);
	  	  row.appendChild(td);
	  	  td  = document.createElement('td');
	  	  td.appendChild(deselect_all);
	  	  table.appendChild(row);
	  	  row.appendChild(td);
	  	  table.className = "event-legend";
	  	  legend_data.forEach(function (entry, index) {
	  	  	  var key         = document.createElement('td');
	  	  	  var description = document.createElement('td');
	  	  	  if (index%columns === 0) {
	  	  	      row = document.createElement('tr');
	  	  	      table.appendChild(row);
	  	  	  }
	  	  	  if (entry.shape) {
				  key.innerHTML = '<img src="' + entry.shape + '" width=16 height=16></img>';
	  	  	  } else {
				  key.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
				  key.style.color = entry.color;
	  	  	  }
	  	  	  key.className = "event-key-active";
	  	  	  key.addEventListener('click',
	  	  	                       function () {
	  	  	                       	   // toggle whether active
	  	  	                       	   var index = inactive_event_types.indexOf(entry.color);
	  	  	                       	   if (index >= 0) {
	  	  	                       	   	   inactive_event_types.splice(index, 1);
	  	  	                       	   	   key.className = "event-key-active";
	  	  	                       	   } else {
	  	  	                       	   	   inactive_event_types.push(entry.color);
	  	  	                       	   	   key.className = "event-key-inactive";
	  	  	                       	   }
	  	  	                       	   refresh();
	  	  	                       	   update();
	  	  	                       });
	  	  	  key.title = "Click to toggle whether this is included or not.";
	  	  	  description.innerHTML = entry.description;
	  	  	  description.className = "event-legend-description";
	  	  	  row.appendChild(key);
	  	  	  row.appendChild(description);
	  	  	  keys.push(key);
	  	  });
	  	  return table;
	  };
	  var video_player      = document.createElement('div');
	  var date_selectors    = document.createElement('div');
	  var periods_interface = document.createElement('div');
	  var unit_selector = function (id) {
	  	  return '<select class="event-unit-select" id="' + id + '">' +
  	             '<option name="seconds">seconds</option>' +
  	             '<option name="minutes">minutes</option>' +
  	             '<option name="hours">hours</option>' +
  	             '<option name="days">days</option>' +
  	             '<option name="days">weeks</option>' +
  	             '</select>';
	  };
	  var seconds_per_unit = function (units) {
	  	  switch (units) {
	  	  	case "minutes": return 60;
	  	  	case "hours":   return 60*60;
	  	  	case "days":    return 60*60*24;
	  	  	case "weeks":   return 60*60*24*7;
	  	  	default: return 1;
	  	  }
	  };
	  var period_change = function () {
	  	  var units_selector = document.getElementById("period-units");
	  	  var period_input   = document.getElementById("period-input");
	  	  period = (+period_input.value)*seconds_per_unit(units_selector.value);
	  	  refresh();
	  };
	  var previous_period_change = function () {
	  	  var units_selector = document.getElementById("previous-period-units");
	  	  var period_input   = document.getElementById("previous-period-input");
	  	  previous_period_duration = (+period_input.value)*seconds_per_unit(units_selector.value);
	  	  refresh();
	  };
	  var time_from_input = function (id) {
	  	  var date = new Date(document.getElementById(id).value).getTime(); // in milliseconds since epoch
	  	  // may differ from an integer number of periods due to daylight savings or leap seconds
	  	  var error = (date-earliest_day)%(period*1000);
  		  return date-error;
	  };
	  entire_interface.appendChild(view_and_controls);
	  view_and_controls.className = 'event-view-and-controls';
	  forward.innerHTML         = '<i class="fa fa-play" aria-hidden="true">';
	  backward.innerHTML        = '<i class="fa fa-backward" aria-hidden="true">';
  	  pause.innerHTML           = '<i class="fa fa-pause" aria-hidden="true">';
  	  step_forward.innerHTML    = '<i class="fa fa-step-forward" aria-hidden="true">';
  	  step_backward.innerHTML   = '<i class="fa fa-step-backward" aria-hidden="true">';
  	  faster.innerHTML          = '<b class="event-replay-button">Faster</b>';
  	  slower.innerHTML          = '<b class="event-replay-button">Slower</b>';
  	  space.innerHTML           = '&nbsp;&nbsp;';
  	  space2.innerHTML          = '&nbsp;&nbsp;';
  	  space3.innerHTML          = '&nbsp;&nbsp;';
  	  period_input.innerHTML    = '<label class="event-number-input" title="View all events that occured within this period of time.">' +
  	                              'Period: ' +
  	                              '<input class="event-number-input" type="number" id="period-input" value="' + period + '">' +
  	                               unit_selector("period-units") +
  	                              '</label>';
  	  previous_period.innerHTML = '<label class="event-number-input" title="Display the previous events as hollow circles that occured within this many seconds before now. If 0 will not be displayed.">' +
  	                              '&nbsp;&nbsp;Previous period: ' +
  	                              '<input class="event-number-input" type="number" id="previous-period-input" value="' + previous_period_duration + '">' +
  	                              unit_selector("previous-period-units") +
  	                              '</label>';
  	  forward.addEventListener('click', forward_action);
  	  backward.addEventListener('click', backward_action);
	  pause.addEventListener('click', pause_action);
	  step_forward.addEventListener('click', step_forward_action);
	  step_backward.addEventListener('click', step_backward_action);
	  faster.addEventListener('click', faster_action);
	  slower.addEventListener('click', slower_action);
	  if (options.legend) {
  	  	  add_legend(options.legend, legend_columns);
  	  }
	  video_player.appendChild(backward);
  	  video_player.appendChild(step_backward);
  	  video_player.appendChild(pause);
  	  video_player.appendChild(step_forward);
  	  video_player.appendChild(forward);
  	  video_player.appendChild(space);
  	  video_player.appendChild(faster);
  	  video_player.appendChild(slower);
      video_player.appendChild(space2);
  	  video_player.appendChild(time_display);
  	  time_display.className = "event-text";
  	  add_to_view_and_controls(video_player);
      start_date_input.innerHTML = '<label class="event-date-input" title="View all events that occured this date or after.">' +
								   'Start: ' +
								   '<input class="event-date-input" type="date" id="start-date-input" value="' + formatDateInput(new Date(earliest_day)) + '">' +
								   '</label>';
      end_date_input.innerHTML   = '<label class="event-date-input" title="View all events that occured this date or before.">' +
								   'End: ' +
								   '<input class="event-date-input" type="date" id="end-date-input" value="'   + formatDateInput(new Date(latest_day)) + '">' +
								   '</label>';
   	  start_date_input.addEventListener('change',
									    function (event) {
										    start_date = time_from_input("start-date-input");
									    });
  	  end_date_input.addEventListener(  'change',
  	                              	    function (event) {
  	                              	        end_date =   time_from_input("end-date-input")+period;
  	                                    });
  	  date_selectors.appendChild(start_date_input);
  	  date_selectors.appendChild(space3);
  	  date_selectors.appendChild(end_date_input);
  	  add_to_view_and_controls(date_selectors);
  	  periods_interface.appendChild(period_input);
  	  periods_interface.appendChild(previous_period);
  	  add_to_view_and_controls(periods_interface);
  	  update_faster_title();
  	  update_slower_title();
  	  period_input   .addEventListener('change', period_change);
  	  previous_period.addEventListener('change', previous_period_change);
  	  setTimeout(function () {
  	  	  // delay to be sure these have been added to the DOM
  	  	  var period_units = document.getElementById("period-units");
  	  	  var previous_period_units = document.getElementById("previous-period-units");
		  period_units.addEventListener('change', period_change);
		  previous_period_units.addEventListener('change', previous_period_change);
		  period_units.value          = options.period_units          || "days";
		  previous_period_units.value = options.previous_period_units || "days";
		  period_change();
		  previous_period_change();
  	  });
  	  // listen for interface to be added to element
  	  observer.observe(element, {childList: true});
  	  element.appendChild(entire_interface);
    };
    // need to wait until interface is added to element before discovering its dimensions to scale it to fit the specified dimensions
    var observer = new MutationObserver(function (mutations) {
                                          mutations.some(function(mutation) {
                                                             var i;
                                                             // mutation.addedNodes is a NodeList so can't use forEach
                                                             for (i = 0; i < mutation.addedNodes.length; i++) {
                                                                  if (mutation.addedNodes.item(i) === entire_interface) {
                                                                  	  scale_to_fit(interface_width, interface_height);
                                                                  	  return true;
                                                                  }
                                                             }
                                                         });
                                      });

    var scale_to_fit = function (interface_width, interface_height) {
                         var scale = Math.min(interface_width  / entire_interface.clientWidth, interface_height / entire_interface.clientHeight);
                         entire_interface.style.transform = "scale("+ scale + "," + scale + ")";
                         entire_interface.style["transform-origin"] = "0 0";
    };

    var add_places = function () {
		svg.append("g")
			.attr("class", "place")
			.selectAll("rect")
		   .data(places)
		   .enter().append("rect")
			   .attr("width",    function (d) {
								 return 2*d.radius;
							 })
				.attr("height",    function (d) {
								 return 2*d.radius;
							 })
			   .attr("fill", function (d) {
								 return d.color;
							 })
			   .attr("x",   function (d) {
								 return d.x-d.radius;
							 })
			   .attr("y",   function (d) {
								 return d.y-d.radius;
							 })
			   .append("title")
				  .text(function (d) {
							return d.title;
						});
	};

    var entire_interface = document.createElement('div');

    var time_display     = document.createElement('span');

    var svg_element      = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    var nodes, svg, earliest_time, latest_time, earliest_day, latest_day, start_date, end_date;

	process_places();

	coordinates_from_place();

	events.forEach(function (event) {
		   if (event.time.getTime) {
		   	   event.time = event.time.getTime();
		   }
		   if (!earliest_time || event.time < earliest_time) {
			   earliest_time = event.time;
		   }
		   if (!latest_time || event.time > latest_time) {
			   latest_time = event.time;
		   }
		   // if the event has an explicit x and y then treat it as the location to display unless there are other events at the same place
		   event.true_x = event.x;
		   event.true_y = event.y;
	});

	earliest_day = new Date(earliest_time);
	earliest_day.setHours(0);
	earliest_day.setMinutes(0);
	earliest_day.setSeconds(0);
	earliest_day = earliest_day.getTime(); // milliseconds since 1 January 1970
	now = earliest_day;
	start_date = now;
	latest_day = new Date(latest_time);
	latest_day.setHours(0);
	latest_day.setMinutes(0);
	latest_day.setSeconds(0);
	latest_day = latest_day.getTime();
    end_date = latest_day;
	events.sort(function (a, b) {
	       	        if (a.time < b.time) {
	       	            return -1;
	       	        }
	       	        if (a.time > b.time) {
	       	            return 1;
	       	        }
	       	        return 0;
	       });

    add_css();
    add_to_view_and_controls(svg_element);
    add_play_buttons();

	svg = d3.select("svg")
				  .attr("width",  view_width)
				  .attr("height", view_height);

	refresh();

    add_places();

    // add nodes for each event
    if (events[0].shape) {
       shape_type = 'image';
   	   nodes = svg.append("g")
		  .attr("class", "event")
        .selectAll(shape_type)
		.data(events)
		.enter().append(shape_type)
 	      .attr("xlink:href", function (d) { return d.shape })
		  .attr("x",  function(d){ return d.x })
		  .attr("y",  function(d){ return d.y })
		  .attr("width",  function(d){ return 2*d.radius })
		  .attr("height", function(d){ return 2*d.radius })
		  .attr("fill", function (d) {
						  return d.color  || options.event_color || 'red';
					    });
    } else {
       shape_type = 'circle';
   	   nodes = svg.select("g")
		  .attr("class", "event")
		.selectAll("circle")
		.data(events)
		.enter().append("circle")
		.attr("r",    function (d) {
						  return d.radius || options.event_radius || 5;
					  })
		.attr("fill", function (d) {
						  return d.color  || options.event_color || 'red';
					  })
		.attr("cx", function (d) {
						return d.x;
					 })
		.attr("cy", function (d) {
						return d.y;
					 });
	}

	nodes
		.append("title")
		  .text(function (d) {
					return d.title;
				});

    setTimeout(update); // delay until units and periods have settled down

    return {refresh: refresh,
            resize:  function (width, height) {
            	         scale_to_fit(width, height);
                     }
           };
};
