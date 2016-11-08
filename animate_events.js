// Developed by Ken Kahn and Martin Hadley of IT Services, University of Oxford

<!-- very loosely based upon https://bl.ocks.org/mbostock/4062045 -->

function animate_events(events, places, options) {

	if (!options) {
		options = {};
	}
	var width                    = options.width                    || 1100;
	var height                   = options.height                   ||  600;
	var periods_per_second       = options.periods_per_second       ||  100;
	var period                   = options.period                   || 24*60*60; // in seconds
	var previous_period_duration = options.previous_period_duration === undefined ? period : options.previous_period_duration;

	var paused            = true;
	var play_direction    = 1; // forward one period
	var formatDate        = d3.timeFormat("%d %b %Y");
	var formatCurrentTime = d3.timeFormat("%d %b %y %H:%M:%S");

    var handle_collisions = function () {
	  	  var now = 0;
		  var end_time = new Date(earliest_day.getTime()+(now*period*1000));
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
								  events_from_this_period.push(event);
								  if (locations_to_events[event.place_id]) {
									  locations_to_events[event.place_id].push(event);
								  } else {
									  locations_to_events[event.place_id] = [event];
								  }
							  } else {
								  spreadout_events_with_the_same_location();
								  now++;
								  end_time = new Date(earliest_day.getTime()+(now*period*1000));
								  events_from_this_period = [];
								  locations_to_events = [];
							  }
			            });
	  };

  var now = 0;

  var current_period = function (time) {
  	  return time-earliest_day >= 1000*(now*period) &&
      	     time-earliest_day <  1000*(now*period+period);
  };

  var previous_period = function (time) {
  	  return paused &&
  	         time-earliest_day >= 1000*(now*period-previous_period_duration) &&
      	     time-earliest_day <  1000*(now*period);
  };

  var update = function () {
  	  // move current_period's and previous_period's event sightings into view and move others out
  	  var date = new Date(earliest_day.getTime()+1000*(now*period+period));
	  // if integer number of days then just display the date otherwise the date and time
	  d3.select(time_display).text(period >= 24*60*60 && period%(24*60*60) === 0 ? formatDate(date) : formatCurrentTime(date));
	  nodes
       .attr("cx",     function (d) {     	                   
						   if (current_period(d.time) || previous_period(d.time)) {
							   return d.x;
						   }
						   return -1000; // offscreen
					   })
       .attr("cy",     function (d) {
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
      if (earliest_time.getTime()+now*period*1000 <= latest_time.getTime() && now >= 0) {
    	  setTimeout(tick, 1000/periods_per_second);
      } else {
      	  // since got the end of the log
      	  paused = true;
      }
  };

  var add_time_display = function () {
  	  time_display = document.createElement('p');
  	  document.body.appendChild(time_display);
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
	  	  period                   = +event.srcElement.value;
	  	  handle_collisions();
	  });
	  previous_period.addEventListener('change', function (event) {
	  	  previous_period_duration = +event.srcElement.value;
	  });	  
	  document.body.appendChild(br);
	  document.body.appendChild(backward);
  	  document.body.appendChild(step_backward);
  	  document.body.appendChild(pause);
  	  document.body.appendChild(step_forward);
  	  document.body.appendChild(forward);
  	  document.body.appendChild(space);
  	  document.body.appendChild(faster);
  	  document.body.appendChild(slower);
  	  document.body.appendChild(space2);
  	  document.body.appendChild(period_input);
  	  document.body.appendChild(previous_period);
  	  update_faster_title();
  	  update_slower_title();
  };

  var nodes, svg, earliest_time, latest_time, earliest_day, time_display;

    add_time_display();  
    document.body.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    add_play_buttons();

	svg = d3.select("svg")
				  .attr("width",  width)
				  .attr("height", height);

	events.forEach(function (event) {
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

	events.sort(function (a, b) {
	       	        if (a.time < b.time) {
	       	            return -1;
	       	        }
	       	        if (a.time > b.time) {
	       	            return 1;
	       	        }
	       	        return 0;
	       });

	  handle_collisions();
    	            
    // add nodes for each event
    nodes = svg
		 .append("g")
		  .attr("class", "event")
		.selectAll("circle")
		.data(events)
		.enter().append("circle")
		.attr("r",    function (d) {
						  return d.radius;
					  })
		.attr("fill", function (d) {
						  return d.color;
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

	// add places
    nodes.select("g")
       .data(places)
       .enter().append("circle")
           .attr("r", function (d) {
      	                  return d.radius;
                  })
           .attr("fill", function (d) {
      	                  return d.color;
                  })
           .attr("cx", function (d) {
          	              return d.x;
                 })
           .attr("cy", function (d) {
          	              return d.y;
                 });

    svg.selectAll("circle").sort(function (a, b) { 
        if (a.place_id !== undefined) return 1;  // only events have place_ids so send it to front so title tooltip works
        return -1;
    });

    update();
    
};

// the following was extremely slow and pushed circles too far apart
//   var events_index = 0;

//   var handle_collisions = function (now) {
//   	  var end_time = new Date(earliest_time.getTime()+(now*period*1000));
//   	  var events_from_this_period = [];
//   	  events.some(function (event, index) {
//   	  	  if (index < events_index) {
//   	  	  	  // already processed
//   	  	  } else if (event.time <= end_time) {
// //   	  	  	  event.vx = 2.5;
// //   	  	  	  event.vy = 2.5;
//   	  	  	  events_from_this_period.push(event);
//   	  	  } else {
//   	  	      events_index = index;
//   	  	  	  return true;
//   	  	  }
//   	  });
//   	  if (events_index === events.length-1) {
//   	  	  tick();
//   	  	  return;
//   	  }
//   	  if (events_from_this_period.length < 2) {
//   	  	  handle_collisions(now+1);
//   	  	  return;
//   	  }
//   	  console.log(events_from_this_period.length)
//       d3.forceSimulation(events_from_this_period)
// 		// based on http://bl.ocks.org/mbostock/31ce330646fa8bcb7289ff3b97aab3f5
// 		.velocityDecay(0.2)
// 		.force("x", d3.forceX().strength(0.002))
// 		.force("y", d3.forceY().strength(0.002))
// 		.force("collide", d3.forceCollide().radius(function(d) { 
// 														return d.radius + 0.5; 
// 												   }).iterations(2))
// 		.on("tick", function (d) {
// 					})
// 		.on("end", function () {
// 					   if (events_index < events.length-1) {
// 						   handle_collisions(now+1);
// 					   } else {
// 					   	   tick();
// 					   }
// 			});
//     };

//     handle_collisions(0);