

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

function loadCSVData () {
  d3.csv("avalanche_data.csv").then(function (data) {
    addMarker(data);
  })
}

function addMarker(data) {
  console.log(data);
  // Get the danger rating levels in the data
  var dangerLevels = Array.from(new Set(data.map(d => d.danger_rating_level)));

  // Add checkboxes for each danger rating level
  d3.select('body')
    .selectAll('.checkbox')
    .data(dangerLevels)
    .enter()
    .append('label')
    .text(d => d)
    .append('input')
    .attr('type', 'checkbox')
    .property('checked', true)
    .on('change', updateMarkers);

  // Add all the markers initially
  var markers = map.svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).x; })
    .attr('cy', function(d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).y; })
    .attr('r', function(d) { return d.involved_dead; })
    .attr('fill', 'red')
    .attr('opacity', 0.5)
    .on('mouseover', function(d) { d3.select(this).attr('opacity', 1); })
    .on('mouseout', function(d) { d3.select(this).attr('opacity', 0.5); })
    .append('title')
    .text(function(d) { return d.tooltip; });

    function updateMarkers() {
      console.log('Updating markers...');
    
      // Get the danger rating levels that are checked and convert them to numbers
      var checkedLevels = d3.selectAll('input[type=checkbox]:checked').nodes().map(d => d.parentNode.textContent.trim());
      console.log(checkedLevels);
      map.svg.selectAll('circle')
      .data(data.filter(d => checkedLevels.includes(d.danger_rating_level)))
      .transition() 
      .duration(500)
      .attr('r', function(d) { return d.involved_dead; });
      
    
      // Hide the markers that are not in the filtered data
      map.svg.selectAll('circle')
        .data(data.filter(d => !checkedLevels.includes(d.danger_rating_level)))
        .transition() // Add a transition to fade out the markers
        .duration(500)
        .attr('r', 0);
    }
}