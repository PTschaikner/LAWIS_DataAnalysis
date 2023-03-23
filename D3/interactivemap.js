

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

function loadCSVData() {
  d3.csv("avalanche_data.csv").then(function (data) {
    addMarker(data);
  })
}


function addMarker(data) {
  console.log(data);
  // Get the danger rating levels in the data
  var dangerLevels = ['low', 'moderate', 'considerable', 'high', 'very high', 'not assigned'];

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
  function createCircle(group, selector, color, opacity, radiusFn) {
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

  function fatalRadius() { return 1 + d.involved_dead * 1.2 };
  function injuredRadius() {return 1 + d.involved_injured * 1.2 };
  function otherRadius() {return 1.5 };

  // Add the SVG circles to the g groups
  createCircle(fatalAvalancheGroup, 'circle.fatal', 'red', 0.5, fatalRadius);
  createCircle(injuredAvalancheGroup, 'circle.injured', 'orange', injuredRadius);
  createCircle(otherAvalancheGroup, 'circle.other', 'gray', 0.6, otherRadius);



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
    resetRadius(injurredAvalancheGroup, 'circle.injured', injuredRadius);
    resetRadius(otherAvalancheGroup, 'circle.other', otherRadius);

  }
}