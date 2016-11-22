// Developed by Ken Kahn and Martin Hadley of IT Services, University of Oxford
// copyright??

<!-- very loosely based upon https://bl.ocks.org/mbostock/4062045 -->

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
	                 }
	       };
};

function animate_events(events, options, element) {
	// events should be an array of objects with 
	//   event_type_id (a number between 0 and one less than the number of unique event types),
	//   time (a JavaScript Date object),
	// and optionally
	//   radius, color, title, and any other fields
	// options include:
	//   places (an array of objects with ... )
	//   place_key (a string corresponding to a field in the events -- )
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
	var previous_period_duration = options.previous_period_duration === undefined ? period : options.previous_period_duration;

	var paused            = true;
	var play_direction    = 1; // forward one period
	var formatDate        = d3.timeFormat("%d %b %Y");
	var formatCurrentTime = d3.timeFormat("%d %b %y %H:%M:%S");
	var inactive_event_types = [];

	var compute_places = function () {
		var place_names = [];
		var place_key = options.place_key || "place";
		events.forEach(function (event) {
			if (event[place_key] && place_names.indexOf(event[place_key]) < 0) {
				place_names.push(event[place_key]);
			}	
		});
		var places = place_names.map(function (place_name, index) {
	       var theta = 2 * Math.PI / place_names.length;
	       var rotation = -Math.PI / 2; // so the first place is at 12 o'clock
	       var horizontal_margin  = options.horizontal_margin || 100;
	       var vertical_margin    = options.vertical_margin   || 100;
	       var place_color        = options.place_color       || 'lavenderblush';
	       var ellipse_width      = view_width /2-horizontal_margin;
	       var ellipse_height     = (view_height/2-vertical_margin);
	       var ellipse_circumference = 2 * Math.PI * Math.sqrt((ellipse_width * ellipse_width + ellipse_height * ellipse_height) / 2);
	       var radius            = options.radius || ellipse_circumference / (2 * place_names.length);
           return {x:      ellipse_width  * Math.cos(index * theta + rotation) + view_width/2, 
                   y:      ellipse_height * Math.sin(index * theta + rotation) + view_height/2,
                   radius: radius,
		           color:  place_color,
		           id:     index,
		           title:  place_name};
	       });
	    events.forEach(function (event) {
			event.place_id = place_names.indexOf(event[place_key]);
	    });
	    return places;
	};

	var coordinates_from_place = function () {
		events.forEach(function (event) {
			var place = places[event.place_id];
			if (event.x === undefined) {
				event.x = place.x;
			}
			if (event.y === undefined) {
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
"	cursor: pointer;" +
"}" +
".event-replay-button, .event-number-input {" +
"	font-family: Segoe UI,Arial,sans-serif;" +
"	font-weight: bold;	" +
"	font-size: 1em;" +
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
	  	  var now = 0;
		  var end_time = new Date(earliest_day+(now*period*1000));
		  var events_from_this_period = [];
		  var locations_to_events = [];
		  var spreadout_events_with_the_same_location = function () {
			  if (events_from_this_period.length < 2) {
			  	  return;
			  }
			  Object.keys(locations_to_events).map(function (key) {
			  	  if (locations_to_events[key].length > 1) {
			  	 	 spreadout(locations_to_events[key]);
			  	  }
			  });
		  };
		  var spreadout = function (events_at_same_place) {
		  	  var circumference = 0;		  	  
		  	  var radius = 0;
		  	  var arc_length = 0;
		  	  events_at_same_place.forEach(function (event) {
		  	  	  circumference += event.radius*2;
		  	  }); 	  
		  	  radius = circumference / (2 * Math.PI);
		  	  events_at_same_place.forEach(function (event) { 
		  	      // fraction of the circle to the center of the current circle
		  	      var angle = (arc_length+event.radius) * 2 * Math.PI / circumference;
		  	  	  event.x = event.original_x + radius * Math.cos(angle);
		  	  	  event.y = event.original_y + radius * Math.sin(angle);
		  	  	  arc_length += event.radius*2;  
		  	  });
		  };
	      events.forEach(function (event, index) {
							  if (event.time < end_time) {
							  	  if (inactive_event_types.indexOf(event.color) < 0) {
									  events_from_this_period.push(event);
									  if (locations_to_events[event.place_id]) {
										  locations_to_events[event.place_id].push(event);
									  } else {
										  locations_to_events[event.place_id] = [event];
									  }
							  	  }
							  } else {
								  spreadout_events_with_the_same_location();
								  now++;
								  end_time = new Date(earliest_day+(now*period*1000));
								  events_from_this_period = [];
								  locations_to_events = [];
							  }
			            });
	  };

  var now = 0;

  var current_period = function (time) {
  	  if (time.getTime) {
  	  	  time = time.getTime();
  	  }
  	  return time-earliest_day >= 1000*(now*period) &&
      	     time-earliest_day <  1000*(now*period+period);
  };

  var previous_period = function (time) {
  	  if (time.getTime) {
  	  	  time = time.getTime();
  	  }  	
  	  return paused &&
  	         time-earliest_day >= 1000*(now*period-previous_period_duration) &&
      	     time-earliest_day <  1000*(now*period);
  };

  var update = function () {
  	  // move current_period's and previous_period's event sightings into view and move others out
  	  var date = new Date(earliest_day+1000*(now*period+period));
	  // if integer number of days then just display the date otherwise the date and time
	  d3.select(time_display).text(period >= 24*60*60 && period%(24*60*60) === 0 ? formatDate(date) : formatCurrentTime(date));
	  nodes
       .attr("cx",     function (d) {
       	                   if (inactive_event_types.indexOf(d.color) >= 0) {
       	                   	   return -1000;
       	                   }   	                   
						   if (current_period(d.time) || previous_period(d.time)) {
							   return d.x;
						   }
						   return -1000; // offscreen
					   })
       .attr("cy",     function (d) {
       	       	           if (inactive_event_types.indexOf(d.color) >= 0) {
       	                   	   return -1000;
       	                   } 
						   if (current_period(d.time) || previous_period(d.time)) {
							   return d.y;
						   }
						   return -1000; // offscreen
					   })
	    // current_period's are solid coloured circles with a white border and yesterday's are white with a coloured border
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
	   .attr("r",     function (d) {
      	                  return d.radius;
                      });
  };

  var tick = function() {
	  update();
	  if (paused) {
	  	  return;
	  }
      now += play_direction;
      if (earliest_time+now*period*1000 <= latest_time && now >= 0) {
    	  setTimeout(tick, 1000/periods_per_second);
      } else {
      	  // since got the end of the log
      	  paused = true;
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
  	  var forward         = document.createElement('button');
  	  var backward        = document.createElement('button');
  	  var pause           = document.createElement('button');
  	  var step_forward    = document.createElement('button');
  	  var step_backward   = document.createElement('button');
  	  var faster          = document.createElement('button');
  	  var slower          = document.createElement('button');
  	  var space           = document.createElement('span');
  	  var space2          = document.createElement('span');
  	  var period_input    = document.createElement('span');
  	  var previous_period = document.createElement('span');
  	  var br              = document.createElement('br');
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
	                                 now++;
	                                 update();
	                             };
	  var step_backward_action = function () {
	                                 now--;
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
	  var create_legend = function (columns) {
	  	  var table = document.createElement('table');
	  	  var row;
	  	  table.className = "event-legend";
	  	  options.legend.forEach(function (entry, index) {
	  	  	  var key         = document.createElement('td');
	  	  	  var description = document.createElement('td');
	  	  	  if (index%columns === 0) {
	  	  	      row = document.createElement('tr');
	  	  	      table.appendChild(row);
	  	  	  }
	  	  	  key.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
	  	  	  key.style.color = entry.color;
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
	  	  });
	  	  return table;
	  };
	  var video_player      = document.createElement('div');
	  var periods_interface = document.createElement('div');
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
  	  period_input.innerHTML    = '<label class="event-number-input" title="View all events that occured within this period of time.">' + 
  	                              'Period (in seconds): ' + 
  	                              '<input class="event-number-input" type="number" value="' + period + '"></label>';
  	  previous_period.innerHTML = '<label class="event-number-input" title="Display the previous events as hollow circles that occured within this many seconds before now. If 0 will not be displayed.">' +
  	                              '&nbsp;Previous period: ' +
  	                              '<input class="event-number-input" type="number" value="' + previous_period_duration + '"></label>';
  	  forward.addEventListener('click', forward_action);
  	  backward.addEventListener('click', backward_action);
	  pause.addEventListener('click', pause_action);
	  step_forward.addEventListener('click', step_forward_action);
	  step_backward.addEventListener('click', step_backward_action);
	  faster.addEventListener('click', faster_action);
	  slower.addEventListener('click', slower_action);
	  period_input.addEventListener('change', function (event) {
	  	  period = +event.srcElement.value;
	  	  refresh();
	  });
	  previous_period.addEventListener('change', function (event) {
	  	  previous_period_duration = +event.srcElement.value;
	  	  refresh();
	  });
	  if (options.legend) {
  	  	  entire_interface.appendChild(create_legend(legend_columns));
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
  	  periods_interface.appendChild(period_input);
  	  periods_interface.appendChild(previous_period);
  	  add_to_view_and_controls(periods_interface);
  	  update_faster_title();
  	  update_slower_title();
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

  var entire_interface = document.createElement('div');

  var time_display     = document.createElement('span');

  var svg_element      = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  var nodes, svg, earliest_time, latest_time, earliest_day;

	if (!places) {
		if (options.place_key) {
			// places should be generated from values of place_key of events
			places = compute_places();
		} else {
			// report error
		}
	}
	coordinates_from_place();
    add_css();
    add_to_view_and_controls(svg_element);
    add_play_buttons();

	svg = d3.select("svg")
				  .attr("width",  view_width)
				  .attr("height", view_height);

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
		   event.original_x = event.x;
		   event.original_y = event.y;
	});

	earliest_day = new Date(earliest_time);
	earliest_day.setHours(0);
	earliest_day.setMinutes(0);
	earliest_day.setSeconds(0);
	earliest_day = earliest_day.getTime(); // milliseconds since 1 January 1970

	events.sort(function (a, b) {
	       	        if (a.time < b.time) {
	       	            return -1;
	       	        }
	       	        if (a.time > b.time) {
	       	            return 1;
	       	        }
	       	        return 0;
	       });

	  refresh();
    	            
    // add nodes for each event
    nodes = svg
		 .append("g")
		  .attr("class", "event")
		.selectAll("circle")
		.data(events)
		.enter().append("circle")
		.attr("r",    function (d) {
						  return d.radius || options.event_radius || 5;
					  })
		.attr("fill", function (d) {
						  return d.color || options.event_color || 'red';
					  })
		.attr("cx", function (d) {
						return d.x;
					 })
		.attr("cy", function (d) {
						return d.y;
					 });

    nodes             
		.append("title")
		  .text(function (d) { 
					return d.title; 
				});

	// if places don't have x,y coordinates then place them in a circle?
	// add places
    nodes.select("g")
       .data(places)
       .enter().append("circle")
           .attr("r",    function (d) {
      	                     return d.radius;
                         })
           .attr("fill", function (d) {
      	                     return d.color;
                         })
           .attr("cx",   function (d) {
          	                 return d.x;
                         })
           .attr("cy",   function (d) {
          	                 return d.y;
                         })
           .append("title")
			  .text(function (d) { 
						return d.title; 
					});

    svg.selectAll("circle").sort(function (a, b) { 
        if (a.place_id !== undefined) return 1;  // only events have place_ids so send it to front so title tooltip works
        return -1;
    });

    update();

    return {refresh: refresh,
            resize:  function (width, height) {
            	         scale_to_fit(width, height);
                     }
           };
};
