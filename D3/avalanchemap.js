

var map = null;
var zoomLevel = 13;
var paris = new L.LatLng(47.259659, 11.400375);

function showMap() {
  initMap();
  loadCSVData();
}

function initMap() {
  var tileLayer = createTileLayer();
  var mapOptions = {
    center: paris,
    zoom: zoomLevel,
    layers: [tileLayer]
  };
  map = new L.Map('leaflet-map', mapOptions);
 }
   function createTileLayer() {
    var tileSourceURL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    var tileSourceOptions = {
     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    };
    return new L.TileLayer(tileSourceURL, tileSourceOptions);
  }

  function loadCSVData() {
    d3.csv("http://localhost:8000/avalanche_data.csv", function(data) {
      data.forEach(function (avalanche) {
        addMarker(avalanche);
      });
    });
  }
  
  function addMarker(avalanche) {
    var radius = 20;
    var color = 'green';
    if (avalanche.involved_dead > 0) {
      color = 'red';
    }
    L.circle([avalanche.location_latitude, avalanche.location_longitude], radius, {
    color: color,
    fillColor: color})
      .addTo(map);
  }

  