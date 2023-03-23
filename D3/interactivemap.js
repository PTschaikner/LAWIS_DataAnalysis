// Declare global variables
const map = null;
const zoomLevel = 9;
const innsbruck = new L.LatLng(47.259659, 11.400375);
const dangerLevels = ['low', 'moderate', 'considerable', 'high', 'very high', 'not assigned'];
const mapOptions = {
  center: innsbruck,
  zoom: zoomLevel,
  layers: [createTileLayer()],
  dragging: false,
  touchZoom: false,
  zoomControl: false,
  scrollWheelZoom: false,
  doubleClickZoom: false
};

// Show the map and load data
function showMap() {
  initMap();
  loadCSVData();
}


// Initialize the Leaflet map
function initMap() {
  const tileLayer = createTileLayer();
  map = new L.Map('leaflet-map', mapOptions);
  map.addLayer(tileLayer);
  map._initPathRoot();
  map.svg = d3.select('#leaflet-map').select('svg');
}

function createTileLayer() {
  const tileSourceURL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
  const tileSourceOptions = {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
  };
  return new L.TileLayer(tileSourceURL, tileSourceOptions);
}

// Load the CSV data and add markers to the map
function loadCSVData() {
  d3.csv("avalanche_data.csv").then(addMarkers);
}


function addMarkers(data) {
  console.log(data);
  // Add checkboxes for each danger rating level
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

  // Add the markers to the correct g groups
  var fatalAvalancheGroup = d3.select('svg').append('g').attr('class', 'fatal-avalanche-group');
  var injuredAvalancheGroup = d3.select('svg').append('g').attr('class', 'injured-avalanche-group');
  var otherAvalancheGroup = d3.select('svg').append('g').attr('class', 'other-avalanche-group');

  // Create a helper function to create SVG circles
  function createAvalancheMarker(group, selector, color, opacity, radiusFn) {
    group.selectAll(selector)
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function (d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).x; })
      .attr('cy', function (d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).y; })
      .attr('r', radiusFn)
      .attr('fill', color)
      .attr('opacity', opacity);
  }

  // Define functions to calculate the radius of the circles
  function fatalRadius() { return 1 + d.involved_dead * 1.2 };
  function injuredRadius() { return 1 + d.involved_injured * 1.2 };
  function otherRadius() { return 1.5 };

  // Add the SVG circles to the g groups
  createAvalancheMarker(fatalAvalancheGroup, 'circle.fatal', 'red', 0.5, fatalRadius);
  createAvalancheMarker(injuredAvalancheGroup, 'circle.injured', 'orange', injuredRadius);
  createAvalancheMarker(otherAvalancheGroup, 'circle.other', 'gray', 0.6, otherRadius);


  // Define function to update markers based on checkbox selection
  function updateMarkers() {
    console.log('Updating markers...');

    // Get the danger rating levels that are checked
    var checkedLevels = d3.selectAll('input[type=checkbox]:checked').nodes().map(d => d.value);
    console.log(checkedLevels);


    // Update the markers that should be hidden
    map.svg.selectAll('circle')
      .filter(d => !checkedLevels.includes(d.danger_rating_text))
      .transition() // Add a transition to fade out the markers
      .duration(500)
      .attr('r', 0);

    // Update the markers that should be shown
    function resetRadius(group, selector, radiusFn) {
      group.selectAll(selector)
        .filter(d => checkedLevels.includes(d.danger_rating_text))
        .transition()
        .duration(500)
        .attr('r', radiusFn)
    }

    resetRadius(fatalAvalancheGroup, 'circle.fatal', fatalRadius);
    resetRadius(injuredAvalancheGroup, 'circle.injured', injuredRadius);
    resetRadius(otherAvalancheGroup, 'circle.other', otherRadius);

  }
}