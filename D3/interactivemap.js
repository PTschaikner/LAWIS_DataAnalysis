

var map = null;
var zoomLevel = 9;

var innsbruck = new L.LatLng(47.259659, 11.400375);
var dangerLevels = ['low', 'moderate', 'considerable', 'high', 'very high', 'not assigned'];

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

// Load the CSV data and add markers to the map
function loadCSVData() {
  d3.csv("avalanche_data.csv").then(function (data) {
    addMarker(data);
  })
}


function addMarker(data) {
  console.log(data);
  // Get the danger rating levels in the data


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

  var markers = map.svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function (d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).x; })
    .attr('cy', function (d) { return map.latLngToLayerPoint([d.location_latitude, d.location_longitude]).y; })
    .each(function (d) {
      if (d.involved_dead > 0) {
        fatalAvalancheGroup.node().appendChild(this);
      } else if (d.involved_injured > 0) {
        injuredAvalancheGroup.node().appendChild(this);
      } else {
        otherAvalancheGroup.node().appendChild(this);
      }
    });

  function setMarkerAttributes(group, fill, opacity, radiusFn) {
    group.selectAll('circle')
      .attr('fill', fill)
      .attr('opacity', opacity)
      .transition() // Add a transition to fade out the markers
      .duration(2000)
      .attr('r', radiusFn);
  }


  function fatalRadius(d) { return 1 + d.involved_dead * 1.2 };
  function injuredRadius(d) { return 1 + d.involved_injured * 1.2 };
  function otherRadius(d) { return 1.5 };

  setMarkerAttributes(fatalAvalancheGroup, 'red', 0.5, fatalRadius);
  setMarkerAttributes(injuredAvalancheGroup, 'orange', 0.5, injuredRadius);
  setMarkerAttributes(otherAvalancheGroup, 'gray', 0.6, otherRadius);


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
    function resetRadius(group, radiusFn) {
      group.selectAll('circle')
        .filter(d => checkedLevels.includes(d.danger_rating_text))
        .transition()
        .duration(500)
        .attr('r', radiusFn);
    }

    resetRadius(fatalAvalancheGroup, fatalRadius);
    resetRadius(injuredAvalancheGroup, injuredRadius);
    resetRadius(otherAvalancheGroup, otherRadius);
  }
}