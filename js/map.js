

var map = (function () {

  var files = ['5_mile_airport.geojson', 'us_military.geojson', 'us_national_park.geojson'];
  var sources = [];
  var polygons = [];
  var mapObj = undefined;

  return {

    init: function() {
      $.when(
        $.getJSON('js/sources/' + files[0]),
        $.getJSON('js/sources/' + files[1]),
        $.getJSON('js/sources/' + files[2])
      ).done(function() {
        for(var i = 0; i < arguments.length; ++i) {
          sources = sources.concat(arguments[i][2].responseJSON.features);
        }
        map.build();
      });
    },

    build: function() {
      //so lets build all the polygons on the map
      mapObj = new google.maps.Map($('#map-canvas')[0], {
        center: {
          lat: -34.397,
          lng: 150.644
        },
        zoom: 8,
        disableDefaultUI: true
      });

      // loop through the sources to get the polygon information
      for(var i = 0; i < sources.length; ++i) {
        var coordinates = sources[i].geometry.coordinates;
        for(var j = 0; j < coordinates.length; ++j) {

          //build the polygon coordinates
          var polyCoords = [];
          for(var k = 0; k < coordinates[j].length; ++k) {
            polyCoords.push(new google.maps.LatLng(coordinates[j][k][1], coordinates[j][k][0]));
          }

          // create the polygon object
          var polygon = new google.maps.Polygon({
            paths: polyCoords,
            strokeColor: '#000000',
            strokeOpacity: 0.6,
            strokeWeight: 0.5,
            fillColor: '#000000',
            fillOpacity: 0.2
          });

          // set the map for the polygon and append it to the array
          polygon.setMap(mapObj);
          polygons.push(polygon);

        }
      }

      //check if my position is inside one of the areas
      map.contains();
    },

    contains: function(callback) {

      //get the users current position
      navigator.geolocation.getCurrentPosition(function(pos) {

        // create position object for google maps
        var position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

        // set the center of the map to our position and zoom in
        mapObj.setCenter(position);
        mapObj.setZoom(12);

        // loop through polygons and check if our position is in it
        for(var i = 0; i < polygons.length; ++i) {
          var contains = google.maps.geometry.poly.containsLocation(
            position,
            polygons[i]
          );
          if(contains) {
            break;
          }
        }

        // call the callback
        if(callback) callback(contains);
      }, function(err) {

        // failed to grab user position so alert them
        alert('Failed to grab users current location.');
      }, {
        enableHighAccuracy : true,
        timeout: 1500,
        maximumAge : 0
      });
    }
  };

})();
