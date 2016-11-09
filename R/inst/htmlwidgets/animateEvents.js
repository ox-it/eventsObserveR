HTMLWidgets.widget({

  name: "animateEvents",
  
  type: "output",
  
  factory: function(element, width, height) {
  
    // create our animateEvents object and bind it to the element
    var animateEventsWidget = create_event_animator(element);
    
    return {
      renderValue: function(x) {
          
        // parse data
        var parser = new DOMParser();
        var data = parser.parseFromString(x.data, "application/xml");
        animateEventsWidget.initialise(x.events, x.places, x.settings);
        animateEventsWidget.refresh();
      },
      
      resize: function(width, height) {
        
        // forward resize on to animateEvents renderers
        for (var name in animateEventsWidget.renderers)
          animateEventsWidget.renderers[name].resize(width, height);  
      },
      
      // Make the animateEvents object available as a property on the widget
      // instance we're returning from factory(). This is generally a
      // good idea for extensibility--it helps users of this widget
      // interact directly with animateEvents, if needed.
      s: animateEventsWidget
    };
  }
});