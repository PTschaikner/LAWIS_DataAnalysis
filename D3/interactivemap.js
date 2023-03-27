// Define initial variables and constants
let map = null;
const zoomLevel = 9;
const innsbruck = new L.LatLng(47.259659, 11.400375);
const dangerLevels = ['low', 'moderate', 'considerable', 'high', 'very high', 'not assigned'];
let fatalAvalancheGroup = null;
let injuredAvalancheGroup = null;
let otherAvalancheGroup = null;
let checkedLevels = null;

// Create the map and load the data
function showMap() {
  initMap();
  loadCSVData();
}

// Initialize the map
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

// Load the CSV data and call the add markers function
function loadCSVData() {
  d3.csv("avalanche_data.csv").then(function (data) {
    addMarker(data);
  })
}

// Add the Checkboxes, later do this in HTML directly
function addCheckboxes() {
  d3.select('body')
    .selectAll('.checkbox')
    .data(dangerLevels)
    .enter()
    .append('label')
    .text(d => d)
    .append('input')
    .attr('type', 'checkbox')
    .attr('value', d => d) // set the value attribute to the danger rating level
    .property('checked', true)
    .on('change', updateMarkers);
}

// helper functions to dynamically set the styling of each avalanche based on the Group
function setMarkerAttributes(group, fill, opacity, radiusFn) {
  group.selectAll('circle')
    .attr('fill', fill)
    .attr('opacity', opacity)
    .transition() // Add a transition to fade out the markers
    .duration(2000)
    .attr('r', radiusFn);
}

function fatalRadius(d) { return 2 + d.involved_dead * 1.2 };
function injuredRadius(d) { return 2 + d.involved_injured * 1.2 };
function otherRadius(d) { return 2 };


// Add the markers to the map
function addMarker(data) {
  // Add checkboxes for each danger rating level
  addCheckboxes();

  // Add the markers to the correct g groups
  fatalAvalancheGroup = d3.select('svg').append('g').attr('class', 'fatal-avalanche-group');
  injuredAvalancheGroup = d3.select('svg').append('g').attr('class', 'injured-avalanche-group');
  otherAvalancheGroup = d3.select('svg').append('g').attr('class', 'other-avalanche-group');

  // create arc generator 
  var arcGen = d3.arc()
    .innerRadius(function (d) {
      return (3+d.involved_injured * 1.2); // Set the outer radius dynamically based on d.involved_injured
    })
    .outerRadius(function (d) {
      return (3+d.involved_harmed * 1.2); // Set the outer radius dynamically based on d.involved_injured
    })
    .startAngle(0)
    .endAngle(2 * Math.PI);

  // Add the markers to the correct g groups without stlyling
  map.svg.selectAll('path')
    .data(data)
    .enter()
    .append("path")
    .attr('transform', function (d) {
      const point = map.latLngToLayerPoint([d.location_latitude, d.location_longitude]);
      return `translate(${point.x}, ${point.y})`;
    })
    .attr("d", arcGen)
    .attr("fill", "red")
    .attr("opacity", 0.5);


  // set marker attributes for each Group
  setMarkerAttributes(fatalAvalancheGroup, 'red', 0.5, fatalRadius);
  setMarkerAttributes(injuredAvalancheGroup, 'orange', 0.5, injuredRadius);
  setMarkerAttributes(otherAvalancheGroup, 'gray', 0.6, otherRadius);
}


function resetRadius(group, radiusFn) {
  group.selectAll('circle')
    .filter(d => checkedLevels.includes(d.danger_rating_text))
    .transition()
    .duration(500)
    .attr('r', radiusFn);
}
function updateMarkers() {
  // Get the danger rating levels that are checked
  checkedLevels = d3.selectAll('input[type=checkbox]:checked').nodes().map(d => d.value);

  // Update the markers that should be hidden
  map.svg.selectAll('circle')
    .filter(d => !checkedLevels.includes(d.danger_rating_text))
    .transition() // Add a transition to fade out the markers
    .duration(500)
    .attr('r', 0);

  // Update the markers that should be shown
  resetRadius(fatalAvalancheGroup, fatalRadius);
  resetRadius(injuredAvalancheGroup, injuredRadius);
  resetRadius(otherAvalancheGroup, otherRadius);
}