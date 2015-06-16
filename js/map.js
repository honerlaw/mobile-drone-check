

var map = (function () {

  var files = ['5_mile_airport.geojson', 'us_military.geojson', 'us_national_park.geojson'];
  var sources = [];
  var polygons = [];
  var mapObj = undefined;
  var marker = undefined;

  return {

    init: function() {
      setTimeout(map.build, 0);
      $.when(
        $.getJSON('js/sources/' + files[0]),
        $.getJSON('js/sources/' + files[1]),
        $.getJSON('js/sources/' + files[2])
      ).done(function() {
        for(var i = 0; i < arguments.length; ++i) {
          sources = sources.concat(arguments[i][2].responseJSON.features);
        }
        map.load();
      });
    },

    build: function() {
      mapObj = new google.maps.Map($('#map-canvas')[0], {
        center: {
          lat: -34.397,
          lng: 150.644
        },
        styles: [
          {
            featureType: "poi",
            stylers: [
              {
                visibility: "off"
              }
            ]
          },
          {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [
                { "saturation": -75 },
              ]
          }, {
              "featureType": "road.arterial",
              "elementType": "geometry",
              "stylers": [
                { "saturation": -75 },
              ]
          }, {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "administrative",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "transit",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "water",
              "elementType": "geometry.fill",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "road",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "administrative",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "landscape",
              "stylers": [
                { "saturation": -75 }
              ]
          }, {
              "featureType": "poi",
              "stylers": [
                { "saturation": -75 }
              ]
          }
        ],
        zoom: 8,
        disableDefaultUI: true
      });
    },

    load: function() {
      // loop through the sources to get the polygon information
      for(var i = 0; i < sources.length; ++i) {
        var coordinates = sources[i].geometry.coordinates;
        for(var j = 0; j < coordinates.length; ++j) {

          //build the polygon coordinates
          var polyCoords = [];
          for(var k = 0; k < coordinates[j].length; ++k) {
            polyCoords.push(new google.maps.LatLng(coordinates[j][k][1], coordinates[j][k][0]));
          }

          polygons.push(new google.maps.Polygon({
            map: mapObj,
            paths: polyCoords,
            strokeColor: '#EF4836',
            strokeOpacity: 0.6,
            strokeWeight: 0.5,
            fillColor: '#EF4836',
            fillOpacity: 0.2
          }));

        }
      }

      var scope = angular.element($('#MainController')).scope();
      scope.$apply(function() {
        scope.data.status = "getting position";
      });

      //check if my position is inside one of the areas
      map.contains();
    },

    contains: function() {

      //get the users current position
      navigator.geolocation.getCurrentPosition(function(pos) {

        // create position object for google maps
        var position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

        // if a marker is already set then we remove it
        if(marker) {
          marker.setMap(null);
          marker = undefined;
        }

        // set the marker
        marker = new google.maps.Marker({
          position: position,
          map: mapObj
        });

        // set the center of the map to our position and zoom in
        mapObj.panTo(position);
        mapObj.setZoom(12);

        var complete = function() {

          // weather our position is in a polygon or not
          var contains = false;

          // loop through polygons and check if our position is in it
          for(var i = 0; i < polygons.length; ++i) {
            contains = google.maps.geometry.poly.containsLocation(
              position,
              polygons[i]
            );
            if(contains) {
              break;
            }
          }

          //get the scope of the app
          var scope = angular.element($('#MainController')).scope();

          //get the weather
          $.getJSON('http://api.openweathermap.org/data/2.5/weather?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude, function(data) {
            var weather = data.weather;
            if(weather.length > 0) {
              scope.data.weather = weather[0].description;
              scope.$apply();
            }
          });

          //update the status
          if(contains) {
            scope.data.status = "no fly zone";
          } else {
            scope.data.status = "good to go";
            scope.data.green = true;
          }
          scope.$apply();
        };

        if(google.maps.geometry) {
          complete();
        } else {
          var temp = setInterval(function() {
            if(google.maps.geometry) {
              complete();
              clearInterval(temp);
            }
          }, 1000);
        }

      }, function(err) {

        // failed to grab user position so alert them
        var scope = angular.element($('#MainController')).scope();
        if(contains) {
          scope.data.status = "position not found.";
        }
      }, {
        enableHighAccuracy : true,
        timeout: 1500,
        maximumAge : 0
      });
    }
  };

})();
