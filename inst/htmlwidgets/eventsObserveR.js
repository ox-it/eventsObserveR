HTMLWidgets.widget({

  name: "eventsObserveR",
  
  type: "output",
  
  factory: function(element, width, height) {
  
    // create our animateEvents object and bind it to the element
    var animateEventsWidget = create_event_animator(element);
    
    return {
      renderValue: function(x) {
          
        // parse data
        var parser = new DOMParser();
        var events = HTMLWidgets.dataframeToD3(x.events);
       
        var settings = x.settings;
        settings.legend = HTMLWidgets.dataframeToD3(settings.legend);
        
        if (settings.places) settings.places = HTMLWidgets.dataframeToD3(settings.places);

        animateEventsWidget.initialise(events, settings);

        animateEventsWidget.refresh();
      },
      
      resize: function(width, height) {
        // forward resize on to animateEvents renderers
//        for (var name in animateEventsWidget.renderers)
//          animateEventsWidget.renderers[name].resize(width, height);  
      },
      
      // Make the animateEvents object available as a property on the widget
      // instance we're returning from factory(). This is generally a
      // good idea for extensibility--it helps users of this widget
      // interact directly with animateEvents, if needed.
      aE: animateEventsWidget
    };
  }
});