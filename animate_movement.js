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
	var previous_period_duration = options.previous_period_duration === undefined ? options.previous_period_duration : period;

	var paused            = false;
	var formatDate        = d3.timeFormat("%d %b %Y");
	var formatCurrentTime = d3.timeFormat("%d %b %y %H:%M:%S");

	var svg = d3.select("svg")
				  .attr("width",  width)
				  .attr("height", height);

	var earliest_time, latest_time, earliest_day;

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
    	            
  // add nodes for each event
  var nodes = svg
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
  	var date;
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
    date = new Date(earliest_day.getTime()+1000*(now*period+period));
	// integer number of days then just display the date otherwise the date and time
	d3.select("#current_time").text(period >= 24*60*60 || period%(24*60*60) === 0 ? formatDate(date) : formatCurrentTime(date));
  };

  var tick = function() {
	  update();
      now++;
      if (earliest_time.getTime()+now*period*1000 <= latest_time.getTime() && !paused) {
    	  setTimeout(tick, 1000/periods_per_second);
      }
  };

  // this didn't work because it ran collision detection for all animal observations so they become very spread out
//     var simulation = d3.forceSimulation(records)
//     // based on http://bl.ocks.org/mbostock/31ce330646fa8bcb7289ff3b97aab3f5
//     .velocityDecay(0.2)
//     .force("x", d3.forceX().strength(0.002))
//     .force("y", d3.forceY().strength(0.002))
//     .force("collide", d3.forceCollide().radius(function(d) { 
//     											    return d.r + 0.5; 
//     										   }).iterations(2))
//     .on("tick", function () {

//     			})
//     .on("end", function () {

  tick();

  // should R do this or should this be a button?
  document.body.addEventListener('click',
								 function () {
									 paused = !paused;
									 if (!paused) {
									    tick(); // resume
									 } else {
									 	update();
									 }
								 });
};