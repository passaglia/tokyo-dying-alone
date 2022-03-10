Promise.all(
  [d3.json("data/wards"),
  fetch("data/alone")
    .then(response =>response.arrayBuffer()),
  d3.json("data/total"),
  ]).then(makeDashboard);

function makeDashboard(data) {
  wards = data[0];
  aloneArrayBuffer = data[1];
  total = data[2];

  // The largest data file is loaded in compressed. Decompress it here
  compressed_file = new Uint8Array(aloneArrayBuffer);
  decompressed_file = fflate.strFromU8(fflate.decompressSync(compressed_file));
  alone = d3.csvParse(decompressed_file);

  // Generate dictionaries which match ward digits to names using the wards geojson
  shortToName = {};
  nameToShort = {};
  _.each(wards.features, function (d) {
    shortToName[d.properties.short_code] = d.properties.ward_en;
    nameToShort[d.properties.ward_en] = d.properties.short_code;
  });

  // Create a Crossfilter instance from the dataset
  var ndx = crossfilter(alone);

  // Define x-axis dimensions of plots
  var yearDim = ndx.dimension(function(d) {return +d["year"]+2000;})
  var wardDim = ndx.dimension(function (d) { return shortToName[+d["ward"]];})
  var genderDim = ndx.dimension(function (d) { if (d["gender"] == 'm'){return "Men";} else if (d["gender"]=='w'){return "Women";}})
  var householdDim = ndx.dimension(function (d) { if (d["household"] == 'm'){return "with Others";} else if (d["household"]=='s'){return "Living alone";}})
  var ageDim = ndx.dimension(function (d) { return d["age"];})
  var timeDim = ndx.dimension(function (d) { return d["time"];})

  // Define data groups. These are what will be plotted in each chart.
  var deathsByAge = ageDim.group().reduceCount();
  var deathsByGender = genderDim.group().reduceCount();
  var deathsByHousehold = householdDim.group().reduceCount();
  var deathsByWard = wardDim.group().reduceCount();
  var deathsByYear = yearDim.group().reduceCount();
  var allDeaths = ndx.groupAll();

  // For deaths by time group we use a hack to allow ordinal plots to be brushed by mapping to integers
  var deathsByTime = timeDim.group().reduceCount();
  keysToIntegers = {}
  integersToKeys = {}
  keys = deathsByTime.top(Infinity).map(d => d.key)
  integers = d3.range(keys.length)
  _.each(integers, function(d){ keysToIntegers[keys[d]] = d; integersToKeys[d] = keys[d]; });
  var ordinalTimeDim = ndx.dimension(function (d) { return keysToIntegers[d["time"]]; })
  var deathsByOrdinalTime = ordinalTimeDim.group().reduceCount();

  /////
  // Now we build each chart
  /////

  // Number of deaths display
  deathsDisplay = dc.numberDisplay("#deaths-display");
  deathsDisplay
      .formatNumber(d3.format(",d"))
      .group(allDeaths)
      .transitionDuration(0)
      .html({ one:"%number death at home",
            some:"%number deaths at home",
            none:"No deaths at home"})
      .valueAccessor(x => x);

  // The text for the fraction display needs to change depending on whether a ward has been selected
  noWardSelectedFractionHtml = {
    one:"%number of all deaths in city",
    some:"%number of all deaths in city",
    none:"0% of all deaths in city"
  }
  WardSelectedFractionHtml = {
    one:"%number of all deaths in ward",
    some:"%number of all deaths in ward",
    none:"0% of all deaths in ward"
  }
  // As a fraction display
  fractionDisplay = dc.numberDisplay("#fraction-display");
  fractionDisplay
    .formatNumber(d3.format(".2%"))
    .html(noWardSelectedFractionHtml)
    .group(allDeaths)
    .transitionDuration(0)
    .valueAccessor(  function (d) {      
      yearfilters = yearChart.filters();
      if (yearfilters.length){
        yearmin = Math.ceil(yearfilters[0][0]);
        yearmax = Math.floor(yearfilters[0][1]);
      }
      else{
        yearmin = 2003;
        yearmax = 2019;
      }
      years = d3.range(yearmin, yearmax+1,1);
      total_deaths_in_time_range = 0;

      wardfilters = choro.filters();
      if (wardfilters.length){
        filteredWard = wardfilters[0];
        for (year of years){
          total_deaths_in_time_range += total[year][nameToShort[filteredWard]];
        }
      }
      else{
        for (year of years){
          total_deaths_in_time_range+=Object.values(total[year]).reduce((partialSum, a) => partialSum + a, 0)
        }
      } 
      return d/total_deaths_in_time_range;
    }
    );

  // Deaths by Gender Chart
  genderChart = dc.barChart("#gender-chart");
  genderChart
    .yAxisLabel("Deaths")
    .dimension(genderDim)
    .group(deathsByGender)
    .xUnits(dc.units.ordinal)
    .x(d3.scaleBand())
    .elasticY(true)
    .width(null)
    .height(null)
    .margins({ top: 10, right: 30, bottom: 45, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'gender-chart-reset'); // turn on the reset button when the chart is filtered
    })
    .addFilterHandler(function(filters, filter) {return [filter];}) // allow single filter only
    .yAxis().ticks(4);
    
  // Deaths by Household Chart
  householdChart = dc.barChart("#household-chart");
  householdChart
    .yAxisLabel("Deaths")
    .dimension(householdDim)
    .group(deathsByHousehold)
    .xUnits(dc.units.ordinal)
    .x(d3.scaleBand())
    .elasticY(true)
    .width(null)
    .height(null)
    .margins({ top: 10, right: 30, bottom: 45, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'household-chart-reset'); // turn on the reset button 
    })
    .addFilterHandler(function(filters, filter) {return [filter];}) // allow single filter only
    .yAxis().ticks(4);

  // Deaths by Time Chart
  timeChart = dc.barChart("#time-chart");
  timeChart
    .xAxisLabel("Days until discovered")
    .yAxisLabel("Deaths")
    .dimension(ordinalTimeDim)
    .group(deathsByOrdinalTime)
    .x(d3.scaleLinear().domain([-.5,8.5]))
    .xUnits(dc.units.integers)
    .centerBar(true)
    .elasticY(true)
    .width(null)
    .height(null)
    .margins({ top: 10, right: 10, bottom: 50, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'time-chart-reset');
      // age chart must be hidden when the time chart is filtered
      // because that cross-dimension data is fake
      var filters = chart.filters();
      if (filters.length) {
        $("#age-chart").hide();
        $("#age-chart-hider").show();
      }
      else{
        $("#age-chart").show();
        $("#age-chart-hider").hide();
      }
    })
    .yAxis().ticks(4);
  
  timeChart.xAxis()
    .tickFormat(function(d) { return integersToKeys[d]; });

  // Deaths by Age Chart
  ageChart = dc.barChart("#age-chart");
  ageChart
    .xAxisLabel("Age")
    .dimension(ageDim)
    .group(deathsByAge)
    .xUnits(function(){return 16})
    .centerBar(true)
    .x(d3.scaleLinear().domain([9, 89]))
    .elasticY(true)
    .width(null)
    .height(null)
    .brushOn(true)
    .margins({ top: 10, right: 10, bottom: 50, left: 45 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'age-chart-reset');
      // time chart must be hidden when the age chart is filtered
      // because that cross-dimension data is fake
      var filters = chart.filters();
      if (filters.length) {
        $("#time-chart").hide();
        $("#time-chart-hider").show();
      }
      else{
        $("#time-chart").show();
        $("#time-chart-hider").hide();
      }
    })
    .yAxis().ticks(4);

  ageChart.xAxis()
    .tickValues(d3.range(12,92,5))
    .tickFormat(function(d) { 
      if (d == 12) {return '<15'};
      if (d == 87) {return '>84'}; 
    return d; });

  // state variables for plot-switching 
  var wardNormalize = false;
  var yearNormalize = false;

  // Deaths by Ward Chart
  wardChart = dc.rowChart("#ward-chart", )
  wardChart
    .dimension(wardDim)
    .group(deathsByWard)
    .width(null)
    .height(null)
    .elasticX(true)
    .gap(0)
    .margins({ top: 5, right: 10, bottom: 20, left: 12 })
    .valueAccessor(function (kv) {
      // divide by total deaths in time range if the normalize toggle is on
      if (wardNormalize) {
        yearfilters = yearChart.filters();
        if (yearfilters.length){
          yearmin = Math.ceil(yearfilters[0][0]);
          yearmax = Math.floor(yearfilters[0][1]);
        }
        else{
          yearmin = 2003;
          yearmax = 2019;
        }
        years = d3.range(yearmin, yearmax+1,1);
        total_deaths_in_time_range = 0;
        for (year of years){
          total_deaths_in_time_range += total[year][nameToShort[kv.key]];
        }
        return kv.value/ total_deaths_in_time_range;
      }
      else {
        return kv.value;
      }
    })
    .ordering(function (kv) {
      if (wardNormalize) {
        yearfilters = yearChart.filters();
        if (yearfilters.length){
          yearmin = Math.ceil(yearfilters[0][0]);
          yearmax = Math.floor(yearfilters[0][1]);
        }
        else{
          yearmin = 2003;
          yearmax = 2019;
        }
        years = d3.range(yearmin, yearmax+1,1);
        total_deaths_in_time_range = 0;
        for (year of years){
          total_deaths_in_time_range += total[year][nameToShort[kv.key]];
        }
        return -kv.value/ total_deaths_in_time_range;     
      }
      else {
        return -kv.value;
      }
    })
    .xAxis().ticks(4);

  // Deaths by Year Chart
  yearChart = dc.barChart("#year-chart");
  yearChart
    .xAxisLabel("Year")
    .dimension(yearDim)
    .group(deathsByYear)
    .x(d3.scaleLinear().domain([2003, 2020]))
    .elasticY(true)
    .brushOn(true)
    .width(null)
    .height(null)
    .margins({ top: 10, right: 15, bottom: 50, left: 45 })
    .valueAccessor(function (kv) {
      // divide by total deaths in ward if normalize is toggled
      if (yearNormalize) {
        wardfilters = choro.filters();
        if (wardfilters.length){
          filteredWard = wardfilters[0];
          return kv.value/total[kv.key][nameToShort[filteredWard]];
        }
        else{
          return kv.value/Object.values(total[kv.key]).reduce((partialSum, a) => partialSum + a, 0)
        }
      }
      else {
        return kv.value;
      }
    })
    .on('filtered', function (chart) {
      toggleReset(chart, 'year-chart-reset');
      if (wardNormalize){
        wardChart.redraw();
      }
    })
    .yAxis().ticks(4);
  
  var xAxis = yearChart.xAxis().ticks(8).tickFormat(d3.format("d"));

  // List of charts to update when the map is hovered over
  // because redrawing the map itself is a little slow
  nonmap_chartlist = [deathsDisplay, fractionDisplay, wardChart, householdChart, ageChart, timeChart, genderChart, yearChart]

  // Initialize the map
  const mapLat_ini = 35.67; // Tokyo
  const mapLong_ini = 139.75; // Tokyo
  const mapZoom_ini = 10.5;
  const box_half_side = .2;
  bounds = L.latLngBounds(L.latLng(mapLat_ini-box_half_side, mapLong_ini-box_half_side),
  L.latLng(mapLat_ini+box_half_side, mapLong_ini+box_half_side));
  var map = L.map('map', { zoomSnap: .25, zoomDelta: .5, maxBounds: bounds}).setView([mapLat_ini, mapLong_ini], mapZoom_ini);
  map.scrollWheelZoom.disable();

  // Load the base layer
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 12.,
    minZoom: 10.,
    id: 'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'sk.eyJ1IjoibWl0aHJpZGF0ZXN2aSIsImEiOiJja3kyazYzbHMwbW5rMzJta3RwMWZ3M3VtIn0.RdGyzCHFQ8i-xkC4utRHPg'
  }).addTo(map);

  // Styles for the map when selecting specific wards
  var unhighlightedStyle = {
    weight: 1.,
    opacity: 0.8,
    color: '#666',
    dashArray: '',
    fillOpacity: .5,
  };
  // highlighed style is cumulative with unhighlighted
  var highlightedStyle = {
    weight: 5,
    opacity: 1,
  };

  // Create info legend to show ward info on hover
  var info = L.control({ position: 'bottomleft' });
  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };
  // Specify update for info legend
  info.update = function (ward_en) {
    if (ward_en) { 
      var deaths = 0;
      var normalized_deaths = 0;
      deathsByWard.top(Infinity).every( function (kv) { if (kv.key == ward_en){
        deaths = kv.value; 
        yearfilters = yearChart.filters();
        if (yearfilters.length){
          yearmin = Math.ceil(yearfilters[0][0]);
          yearmax = Math.floor(yearfilters[0][1]);
        }
        else{
          yearmin = 2003;
          yearmax = 2019;
        }
        years = d3.range(yearmin, yearmax+1,1);
        total_deaths_in_time_range = 0;
        for (year of years){
          total_deaths_in_time_range += total[year][nameToShort[kv.key]];
        }
        normalized_deaths = kv.value/ total_deaths_in_time_range;

        return false;
      }
      else{
        return true;
      }});

      this._div.style.visibility = "visible";
      this._div.innerHTML = '<h4>' + ward_en + ' Ward </h4>' +
      '<p>' + deaths  + " dead in current slice </p>" +
      '<p>' + (normalized_deaths*100).toFixed(1) + "% of all deaths in ward </p>"; 
    } else {
      this._div.style.visibility = "hidden";
    }
  };
  info.addTo(map);

  // State variables for whether selection is locked to one ward
  var ward_lock = false;
  var locked_ward_en;

  // The choropleth overlay on the map 
  // dc_leaflet has some extensions relative to the main brain.
  // forEachFeature and featureOptionsHightlighted and an accessor for the geojson layer
  choro = dc_leaflet.choroplethChartX("#map-anchor");
  choro
    .dimension(wardDim)
    .group(deathsByWard)
    .map(map)
    .geojson(wards)
    .featureOptions(unhighlightedStyle)
    .featureOptionsHighlighted(highlightedStyle)
    // forEachFeature is run on each feature using the forEachFeature method in leaflet.geojson
    .forEachFeature(function (feature, layer) {
      layer.on("mouseover", function (event) {
        if (!(ward_lock)) {
          this.setStyle(highlightedStyle);
          info.update(this.feature.properties.ward_en);
          fractionDisplay.html(WardSelectedFractionHtml);
          wardChart.replaceFilter([[this.feature.properties.ward_en]]);
          choro.replaceFilter([[this.feature.properties.ward_en]]);
          _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
        }
      });
      layer.on("mouseout", function (event) {
        if (!(ward_lock)) {
          this.setStyle(unhighlightedStyle);
          info.update();
          wardChart.replaceFilter([[]]);
          choro.replaceFilter([[]]);
          fractionDisplay.html(noWardSelectedFractionHtml);
          _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
        }
      });
      layer.on("click", function (event) {
        // This triggers before the chart itself gets the click
        if (ward_lock) {
          ward_lock = false;
          locked_ward_en = null;
          info.update(this.feature.properties.ward_en);
          fractionDisplay.html(WardSelectedFractionHtml);
          wardChart.replaceFilter([[]]);
          choro.replaceFilter([[]]);
          choro.geojsonLayer().eachLayer(function (layer) { layer.setStyle(unhighlightedStyle); })
        }
        else {
          ward_lock = true;
          locked_ward_en = this.feature.properties.ward_en;
          info.update(this.feature.properties.ward_en);
          fractionDisplay.html(WardSelectedFractionHtml);
          wardChart.replaceFilter([[this.feature.properties.ward_en]]);
          choro.replaceFilter([[this.feature.properties.ward_en]]);
          choro.geojsonLayer().eachLayer(function (layer) {
            if (layer.feature.properties.ward_en == locked_ward_en) {
              layer.setStyle(highlightedStyle)
            }
          });
        }
        _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
      });
    })
    .colors(d3.scaleSequential(d3.interpolateBlues))
    .colorAccessor(function (kv, i) {
      if (wardNormalize) {
        yearfilters = yearChart.filters();
        if (yearfilters.length){
          yearmin = Math.ceil(yearfilters[0][0]);
          yearmax = Math.floor(yearfilters[0][1]);
        }
        else{
          yearmin = 2003;
          yearmax = 2019;
        }
        years = d3.range(yearmin, yearmax+1,1);
        total_deaths_in_time_range = 0;
        for (year of years){
          total_deaths_in_time_range += total[year][nameToShort[kv.key]];
        }
        return +kv.value/ total_deaths_in_time_range;
      }
      else {
        return +kv.value;
      }
    })
    .on('preRender', function () {
      choro.calculateColorDomain();
    })
    .on('preRedraw', function () {
      choro.calculateColorDomain();
      if (ward_lock){
        info.update(locked_ward_en);
        fractionDisplay.html(WardSelectedFractionHtml);
      }
    })
    .featureKeyAccessor(function (feature) {
      return feature.properties.ward_en;
    })
    .popupMod('ctrlCmd')
    .renderPopup(true)
    .popup(function (d, feature) {
      return feature.properties.ward_en + " : " + d.value;
    });

  // Detect if the user clicked outside the geojson and if the ward is locked then unlock
  map.on("click", function (event) {
    var clickedLayers = leafletPip.pointInLayer(event.latlng, choro.geojsonLayer(), true);
    if (!(clickedLayers.length) && ward_lock) {
      ward_lock = false;
      locked_ward_en = null;
      wardChart.replaceFilter([[]]);
      choro.replaceFilter([[]]);
      info.update()
      fractionDisplay.html(noWardSelectedFractionHtml);
      choro.geojsonLayer().eachLayer(function (layer) { layer.setStyle(unhighlightedStyle); });
      _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
    }
  });

  // Highlight map when mouse over the ward chart
  wardChart.on('renderlet', function (chart) {
    chart
      .selectAll('g.row')
      // highlighted-ward is an arbitrary namespace
      .on('mouseover.highlighted-ward', function (event) {
        if (!(ward_lock)) {
          wardToLayerID = {};
          choro.geojsonLayer().eachLayer(function (layer) {
            wardToLayerID[layer.feature.properties.ward_en] = layer._leaflet_id;
          });
          var key = event.target.__data__.key
          var layer = choro.geojsonLayer().getLayer(wardToLayerID[key]);
          //wardChart.replaceFilter([[layer.feature.properties.ward_en]]);
          choro.replaceFilter([[layer.feature.properties.ward_en]]);
          layer.setStyle(highlightedStyle);
          info.update(layer.feature.properties.ward_en);
          fractionDisplay.html(WardSelectedFractionHtml);
          _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
        }
      })
      .on('mouseout.highlighted-ward', function (event) {
        if (!(ward_lock)) {
          wardToLayerID = {};
          choro.geojsonLayer().eachLayer(function (layer) {
            wardToLayerID[layer.feature.properties.ward_en] = layer._leaflet_id;
          });
          var key = event.target.__data__.key
          var layer = choro.geojsonLayer().getLayer(wardToLayerID[key]);
          //wardChart.replaceFilter([[]]);
          choro.replaceFilter([[]]);
          layer.setStyle(unhighlightedStyle);
          info.update();
          fractionDisplay.html(noWardSelectedFractionHtml);
          _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
        }
      })
      .on('click.highlighted-ward', function (event) {
        // This happens before the chart itself gets the click
        if (ward_lock) {
          ward_lock = false;
          locked_ward_en = null;
          wardChart.replaceFilter([[]]);
          choro.replaceFilter([[]]);
          choro.geojsonLayer().eachLayer(function (layer) { layer.setStyle(unhighlightedStyle); })
        }
        else {
          ward_lock = true;
          wardToLayerID = {};
          choro.geojsonLayer().eachLayer(function (layer) {
            wardToLayerID[layer.feature.properties.ward_en] = layer._leaflet_id;
          });
          var key = event.target.__data__.key
          var layer = choro.geojsonLayer().getLayer(wardToLayerID[key]);

          locked_ward_en = key;
          info.update(layer.feature.properties.ward_en);
          fractionDisplay.html(WardSelectedFractionHtml);
          wardChart.replaceFilter([[key]]);
          choro.replaceFilter([[key]]);
          choro.geojsonLayer().eachLayer(function (layer) {
            if (layer.feature.properties.ward_en == locked_ward_en) {
              layer.setStyle(highlightedStyle)
            }
          });
        }
        _.each(nonmap_chartlist, function (chart) { chart.redraw(); });

      });
  });

  // Toggle reset text for individual chart
  function toggleReset(chart, id) {
    var filters = chart.filters();
    var t = document.getElementById(id);
    var this_script = $('#' + id).data('reset-script');
    if (filters.length) {
      t.innerHTML = "<a href=" + this_script + ">[reset]</a>";
    }
    else {
      t.innerHTML = '';
    }
  }

  // Listen for changes to normalization toggles
  // For ward chart
  var wardSelection = d3.select('#norm-toggle');
  wardSelection.on('change', function(){
    wardNormalize = !(wardNormalize);
    dc.redrawAll();
  });
 // For year chart
  var yearSelection = d3.select('#year-norm-toggle');
  yearSelection.on('change', function(){
    yearNormalize = !(yearNormalize);
    dc.redrawAll();
  });

  // Render all charts
  dc.renderAll();

}

