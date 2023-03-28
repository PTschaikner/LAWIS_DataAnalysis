// Define initial variables and constants
let map = null;
const zoomLevel = 9;
const innsbruck = new L.LatLng(47.259659, 11.400375);
const dangerLevels = ['low', 'moderate', 'considerable', 'high', 'very high', 'not assigned'];
let fatalAvalancheGroup = null;
let injuredAvalancheGroup = null;
let otherAvalancheGroup = null;
let checkedLevels = null;
const calendar = [
  { month: 'July', days: 31, start: 1 },
  { month: 'August', days: 31, start: 32 },
  { month: 'September', days: 30, start: 63 },
  { month: 'October', days: 31, start: 93 },
  { month: 'November', days: 30, start: 124 },
  { month: 'December', days: 31, start: 154 },
  { month: 'January', days: 31, start: 185 },
  { month: 'February', days: 28, start: 216 },
  { month: 'March', days: 31, start: 244 },
  { month: 'April', days: 30, start: 275 },
  { month: 'May', days: 31, start: 305 },
  { month: 'June', days: 30, start: 336 }
]

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
    addHistogram(data);
    addMarker(data);
  })
}

function addHistogram(data) {
  const histogramDiv = d3.select('#histogram');
  const width = histogramDiv.node().getBoundingClientRect().width;
  const height = histogramDiv.node().getBoundingClientRect().height;
  const margin = { top: 20, right: 20, bottom: 50, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create the SVG element with margins
  const svgHist = histogramDiv.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Create x and y scales
  const xScale = d3.scaleLinear()
    .domain([1, 365])
    .range([0, chartWidth]);
  const yScale = d3.scaleLinear()
    .domain([0, 70])
    .range([chartHeight, 0]);

  // Create x and y axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Add the x axis to the bottom of the chart
  svgHist.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(xAxis);

  // Add the y axis to the left of the chart
  svgHist.append('g')
    .call(yAxis);

  const monthRects = svgHist.selectAll('rect')
    .data(calendar)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.start))
    .attr('y', 0)
    .attr('width', d => xScale(d.start + d.days) - xScale(d.start))
    .attr('height', chartHeight)
    .attr('fill', (d, i) => i % 2 === 0 ? 'gray' : 'lightgray')
    .style('opacity', 0.1);

  const monthLabels = svgHist.selectAll('text')
    .data(calendar)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.start))
    .attr('y', 65)
    .text(d => d.month)
    .attr('text-anchor', 'middle')
    .attr("font-size", "12px")
    .attr("fill", "black")
    .style('opacity', 1)


  // Create a selection of circles for each avalanche
  const circles = svgHist.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.day_of_year))
    .attr('cy', d => yScale(d.daycount))
    .attr('r', d => d.involved_dead > 0 ? 2.5 : d.involved_injured > 0 ? 2.5 : 2)
    .style('fill', d => d.involved_dead > 0 ? 'red' : d.involved_injured > 0 ? 'orange' : 'gray')
    .style('opacity', 0.5);
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

function fatalRadius(d) { return 1 + d.involved_dead * 1.2 };
function injuredRadius(d) { return 1 + d.involved_injured * 1.2 };
function otherRadius(d) { return 1.5 };


// Add the markers to the map
function addMarker(data) {
  // Add checkboxes for each danger rating level
  addCheckboxes();

  // Add the markers to the correct g groups
  fatalAvalancheGroup = map.svg.append('g').attr('class', 'fatal-avalanche-group');
  injuredAvalancheGroup = map.svg.append('g').attr('class', 'injured-avalanche-group');
  otherAvalancheGroup = map.svg.append('g').attr('class', 'other-avalanche-group');

  // Add the markers to the correct g groups without stlyling
  map.svg.selectAll('circle')
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