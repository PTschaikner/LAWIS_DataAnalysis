

var map = null;
var zoomLevel = 8;
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
    layers: [tileLayer],
    dragging: false,   // disable map dragging
    touchZoom: false,  // disable touch zoom
    zoomControl: false, // disable zoom buttons
    scrollWheelZoom: false
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

  function loadCSVData() {
    d3.csv("http://localhost:8000/avalanche_data.csv", function(data) {
      var delay = 10; // delay in milliseconds between each marker
      data.forEach(function (avalanche, i) {
        setTimeout(function() {
          addMarker(avalanche);
        }, i * delay);
      });
    });
  }
  
  function addMarker(avalanche) {
    var radius = 2;
    var opacity = 0.4;
    var strokeWidth = 0.5;
    var color = 'gray';
    if (avalanche.involved_dead > 0) {
      color = 'red';
      opacity = 0.8;
    }
    var marker = map.svg.append('circle')
    .attr('cx', map.latLngToLayerPoint([avalanche.location_latitude, avalanche.location_longitude]).x)
    .attr('cy', map.latLngToLayerPoint([avalanche.location_latitude, avalanche.location_longitude]).y)
    .attr('r', 0)
    .style('fill', color)
    .style('stroke', 'black')
    .style('stroke-width', strokeWidth)
    .style('opacity', 0)
    .transition()
      .duration(500)
      .attr('r', radius)
      .style('opacity', opacity);
  }
  