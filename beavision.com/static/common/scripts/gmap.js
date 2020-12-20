gmap  = {
	geocoder: null,
	map: null,
	marker: [],
	options: {streetView: false, mapType: false, markerDraggable: true}
}



gmap.load = function () {
  var script = document.createElement('script');
  script.type = 'text/javascript';

  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyDoV0-tsvujO0mGgwNPFDWi1OLoyg_uvL8&' +
      'callback=mapInit';
  document.body.appendChild(script);
}

gmap.getMyCord = function (obj, cord) {
	if(obj[cord])
		return obj[cord];
		
		var cnt = 1;
		for (var i in obj) {
			if(cord == 'lb' && cnt == 1)
				return obj[i];
			else if(cord == 'mb' && cnt == 2)
				return obj[i];
			cnt++;
		};
}

gmap.parseMapData = function (data) {
	if(data) {
		console.log(data);
		data = $.parseJSON(data);

		gmap.map.setZoom(data.zoom);
		var mapLb = gmap.getMyCord(data.map, 'lb');
		var mapMb = gmap.getMyCord(data.map, 'mb');



//		console.log(data.map.lat());
		gmap.map.panTo(new google.maps.LatLng(mapLb, mapMb));
		if(data.marker.length > 0)
			for(var i=0; i<data.marker.length; i++) {
				var mLb = gmap.getMyCord(data.marker[i], 'lb');
				var mMb = gmap.getMyCord(data.marker[i], 'mb');



			    var marker = new google.maps.Marker({
			          map: gmap.map,
			          draggable: gmap.options.markerDraggable,
			          animation: google.maps.Animation.DROP,
			          position: new google.maps.LatLng(mLb, mMb)
			    });
			    google.maps.event.addListener(marker, 'click', function(e) { if(gmap.options.markerDraggable) this.setMap(null); });
			    gmap.marker.push(marker);
	   		    

			} else if(gmap.options.markerDraggable == false)
				$('#map-canvas').hide();
	}
}

gmap.serializeMapData = function () {
	var theObj = {
					'map': {'H': gmap.map.getCenter().lat(), 'L': gmap.map.getCenter().lng()},
					'zoom': gmap.map.getZoom(),
					'marker': []
				};

	for(var i=0; i<gmap.marker.length; i++) {
		if(gmap.marker[i].getMap() == gmap.map)
			theObj.marker.push({'H': gmap.marker[i].getPosition().lat(), 'L': gmap.marker[i].getPosition().lng()})
	}
	return JSON.stringify(theObj);

	
}

gmap.init = function (initData, bgColor) {
  var MY_MAPTYPE_ID = 'custom_style';
  gmap.geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(42.811522,25.19165);
  var mapOptions = {
    zoom: 7,
    center: latlng,
    mapTypeId: MY_MAPTYPE_ID,
    panControl: false,
    streetViewControl: gmap.options.streetView,
    mapTypeControl: gmap.options.mapType
  }
  //
  var featureOpts = [
    {
      stylers: [ { hue: bgColor } ]
    }    
  ];

  gmap.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  
  var styledMapOptions = {
    name: 'Custom Style'
  };

  var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

  gmap.map.mapTypes.set(MY_MAPTYPE_ID, customMapType);

  if(gmap.options.markerDraggable) {
	  google.maps.event.addListener(gmap.map, 'click', function(e) {
			      var marker = new google.maps.Marker({
			          map: gmap.map,
			          draggable: true,
			          animation: google.maps.Animation.DROP,
			          position: e.latLng
			      });
			      google.maps.event.addListener(marker, 'click', function(e) { this.setMap(null) });
			      gmap.marker.push(marker);

		  });
}

	gmap.parseMapData(initData);
}

gmap.findAndMark = function () {
  var address = $('#googleMapAddress').val();
  gmap.geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      gmap.map.panTo(results[0].geometry.location);
      gmap.map.setZoom(16);

	      var marker = new google.maps.Marker({
	          map: gmap.map,
	          draggable: gmap.options.markerDraggable,
	          animation: google.maps.Animation.DROP,
	          position: results[0].geometry.location
	      });
	      google.maps.event.addListener(marker, 'click', function(e) { this.setMap(null) });
	      gmap.marker.push(marker);

    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

