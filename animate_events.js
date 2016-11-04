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
		  	  	  event.x += radius * Math.cos(angle);
		  	  	  event.y += radius * Math.sin(angle);
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
  	  return time-earliest_day > 1000*(now*period) &&
      	     time-earliest_day < 1000*(now*period+period);
  };

  var previous_period = function (time) {
  	  return paused &&
  	         time-earliest_day > 1000*(now*period-previous_period_duration) &&
      	     time-earliest_day < 1000*(now*period);
  };

  var update = function () {
  	  // move current_period's and previous_period's event sightings into view and move others out
  	  var date = new Date(earliest_day.getTime()+1000*(now*period+period));
	  // if integer number of days then just display the date otherwise the date and time
	  d3.select(time_display).text(period >= 24*60*60 || period%(24*60*60) === 0 ? formatDate(date) : formatCurrentTime(date));
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
      }
  };

  var add_time_display = function () {
  	  time_display = document.createElement('p');
  	  document.body.appendChild(time_display);
  };

  var add_play_button = function () {
  	  play_button  = document.createElement('button');
  	  play_button.className = "play-button";
  	  play_button.innerHTML = "PLAY";
  	  play_button.addEventListener('click',
								   function () {
									   paused = !paused;
									   if (!paused) {
									  	   play_button.innerHTML = "PAUSE";
									       tick(); // resume
									   } else {
									 	   play_button.innerHTML = "RESUME";
									 	   update();
									   }
								  });
  	  document.body.appendChild(play_button);
  };

  var nodes, svg, earliest_time, latest_time, earliest_day, play_button, time_display;

    add_time_display();  
    document.body.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    add_play_button();

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