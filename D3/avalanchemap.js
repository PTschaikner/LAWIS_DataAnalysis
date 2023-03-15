var myMap = L.map('map').setView([47.259659, 11.400375], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(myMap);

d3.csv('avalanche-incidents.csv', function(error, data) {
  if (error) throw error;

  var markers = L.markerClusterGroup();

  var colorScale = d3.scaleOrdinal()
    .domain(['Low', 'Moderate', 'Considerable', 'High', 'Extreme'])
    .range(['green', 'yellow', 'orange', 'red', 'purple']);

  data.forEach(function(d) {
    var marker = L.circleMarker([d.latitude, d.longitude], {
      radius: 10,
      fillColor: colorScale(d.severity),
      fillOpacity: 0.7,
      stroke: false,
    });
    markers.addLayer(marker);
  });

  myMap.addLayer(markers);
});