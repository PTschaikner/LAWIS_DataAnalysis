

var map = null;
var zoomLevel = 9;

var innsbruck = new L.LatLng(47.259659, 11.400375);

function showMap() {
  initMap();
  loadCSVData();
}

function initMap() {
  var tileLayer = createTileLayer();
  var mapOptions = {
    center: innsbruck,
    zoom: zoomLevel,
    layers: [tileLayer],
    dragging: false,   // disable map dragging
    touchZoom: false,  // disable touch zoom
    zoomControl: false, // disable zoom buttons
    scrollWheelZoom: false,
    doubleClickZoom: false
  };
  map = new L.Map('leaflet-map', mapOptions);
  
  // Add SVG layer to map for d3 markers
  map._initPathRoot();
  map.svg = d3.select('#leaflet-map').select('svg');
}

   function createTileLayer() {
    var tileSourceURL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    var tileSourceOptions = {
     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    };
    return new L.TileLayer(tileSourceURL, tileSourceOptions);
  }

