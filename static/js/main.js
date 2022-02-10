Promise.all(
  [d3.json("data/wards"),
  d3.csv("data/alone"),
  d3.json("data/total"),
  ]).then(makeDashboard);

function makeDashboard(data) {
  wards = data[0]
  alone = data[1]
  total = data[2]

  // Generate dictionaries which match ward digits to names using the wards geojson
  shortToName = {};
  _.each(wards.features, function (d) {
    shortToName[d.properties.short_code] = d.properties.ward_en;
  });

  // Get total deaths per year
  total_per_year = {};
  for (var year in total){
    total_per_year[year] = 0;
    _.each(wards.features, function (d) {
      total_per_year[year] +=  total[year][d.properties.short_code];
    });
  }

  // Create a Crossfilter instance from the dataset
  var ndx = crossfilter(alone);

  // Define x-axis dimensions of plots
  var yearDim = ndx.dimension(function(d) {return +d["year"]+2000;})
  var wardDim = ndx.dimension(function (d) { return shortToName[d["ward"]]; })
  var genderDim = ndx.dimension(function (d) { if (d["gender"] == 'm'){return "Men";} else if (d["gender"]=='w'){return "Women";}})
  var householdDim = ndx.dimension(function (d) { if (d["household"] == 'm'){return "with Others";} else if (d["household"]=='s'){return "Living alone";}})
  var ageDim = ndx.dimension(function (d) { return d["age"]; })
  var timeDim = ndx.dimension(function (d) { return d["time"]; })

  // Define data groups. These are what will be plotted in each chart.
  var deathsByAge = ageDim.group().reduceCount();
  var deathsByGender = genderDim.group().reduceCount();
  var deathsByHousehold = householdDim.group().reduceCount();

  // For the deathsByWard we want to enable switching between normalized and unnormalized
  // so we use a custom reduce
  var deathsByWard = wardDim.group().reduce(
    function (p, v) {
      ++p.count;
      p.normalized_count += 1/total[+v.year+2000][v.ward]
      return p;
    },
    function (p, v) {
      --p.count;
      p.normalized_count -= 1/total[+v.year+2000][v.ward]
      return p;
    },
    function () { return {count:0,normalized_count:0}; }
  );

  // Same for deathsByYear
  var deathsByYear = yearDim.group().reduce(
    function (p, v) {
      ++p.count;
      p.normalized_count += 1/total_per_year[+v.year+2000]
      return p;
    },
    function (p, v) {
      --p.count;
      p.normalized_count -= 1/total_per_year[+v.year+2000]
      return p;
    },
    function () { return {count:0,normalized_count:0}; }
  );
  
  // For deaths by we use a hack to allow ordinal plots to be brushed
  var deathsByTime = timeDim.group().reduceCount();
  keysToIntegers = {}
  integersToKeys = {}
  keys = deathsByTime.top(Infinity).map(d => d.key)
  integers = d3.range(keys.length)
  _.each(integers, function(d){ keysToIntegers[keys[d]] = d; integersToKeys[d] = keys[d]; });
  var ordinalTimeDim = ndx.dimension(function (d) { return keysToIntegers[d["time"]]; })
  var deathsByOrdinalTime = ordinalTimeDim.group().reduceCount();


  // Now we build each chart
  
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
    .height(150)
    .margins({ top: 30, right: 30, bottom: 30, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'gender-chart-reset');
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
    .height(150)
    .margins({ top: 30, right: 30, bottom: 30, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'household-chart-reset');
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
    //.ordering(function(d) {x = d.key.split('-')[0].split('>'); return +x[x.length-1];})
    .elasticY(true)
    .width(null)
    .height(null)
    .margins({ top: 10, right: 10, bottom: 50, left: 65 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'time-chart-reset');
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
    //.tickValues(d3.range(mappings.length()))
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


  // state variable for normalization 
  var normalize = false;

  // Deaths by Ward Chart
  wardChart = dc.rowChart("#ward-chart", )
  wardChart
    .dimension(wardDim)
    .group(deathsByWard)
    .width(null)
    .height(375)
    .elasticX(true)
    .gap(0)
    .margins({ top: 10, right: 10, bottom: 40, left: 10 })
    .valueAccessor(function (kv) {
      if (normalize) {
        return kv.value.normalized_count;
      }
      else {
        return kv.value.count;
      }
    })
    .ordering(function (kv) {
      if (normalize) {
        return -kv.value.normalized_count;
      }
      else {
        return -kv.value.count;
      }
    })
    .xAxis().ticks(4);

  // Deaths by Year Chart
  yearChart = dc.barChart("#year-chart");
  yearChart
    .xAxisLabel("Year")
    .dimension(yearDim)
    .group(deathsByYear)
    .x(d3.scaleLinear().domain([2003, 2019]))
    .elasticY(true)
    .width(null)
    .height(null)
    .brushOn(true)
    .valueAccessor(function (kv) {
      if (normalize) {
        return kv.value.normalized_count;
      }
      else {
        return kv.value.count;
      }
    })
    .margins({ top: 10, right: 10, bottom: 50, left: 45 })
    .on('filtered', function (chart) {
      toggleReset(chart, 'year-chart-reset');
    })
    .yAxis().ticks(4);
  
  var xAxis = yearChart.xAxis().ticks(8).tickFormat(d3.format("d"));

  
  // List of charts to update when the map is hovered over
  // because redrawing the map itself is a little slow
  nonmap_chartlist = [wardChart, householdChart, ageChart, timeChart, genderChart, yearChart]

  // Initialize the map
  const mapLat_ini = 35.665; // Tokyo
  const mapLong_ini = 139.75; // Tokyo
  const mapZoom_ini = 10.5;
  const box_half_side = .2;
  bounds = L.latLngBounds(L.latLng(mapLat_ini-box_half_side, mapLong_ini-box_half_side),
  L.latLng(mapLat_ini+box_half_side, mapLong_ini+box_half_side));
  var map = L.map('map', { zoomSnap: .25, zoomDelta: .5, maxBounds: bounds}).setView([mapLat_ini, mapLong_ini], mapZoom_ini);
  // map.dragging.disable();
  // map.touchZoom.disable();
  // map.doubleClickZoom.disable();
  // map.scrollWheelZoom.disable();
  // map.boxZoom.disable();
  // map.keyboard.disable();

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
  var highlightedStyle = {
    weight: 5,
    opacity: 1,
  };

  // Create info div to show ward on hover
  var info = L.control();
  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };
  // Specify update for info legend
  info.update = function (props) {
    if (props) {
      this._div.style.visibility = "visible";
      this._div.innerHTML = '<h4>' + props.ward_en + ' Ward </h4>';  // TODO: Figure out how to add the deaths from the current slice
    } else {
      this._div.style.visibility = "hidden";
    }
  };
  info.addTo(map);

  // State variables for whether selection is locked to one ward
  var ward_lock = false;
  var locked_ward_en;

  // The choropleth overlay on the map 
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
          info.update(this.feature.properties);
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
          _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
        }
      });
      layer.on("click", function (event) {
        // This triggers before the chart itself gets the click
        if (ward_lock) {
          ward_lock = false;
          locked_ward_en = null;
          info.update(this.feature.properties);
          wardChart.replaceFilter([[]]);
          choro.replaceFilter([[]]);
          choro.geojsonLayer().eachLayer(function (layer) { layer.setStyle(unhighlightedStyle); })
        }
        else {
          ward_lock = true;
          locked_ward_en = this.feature.properties.ward_en;
          info.update(this.feature.properties);
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
    .colorAccessor(function (d, i) {
      if (normalize) {
        //return +d.value / total_deaths_this_year[nameToShort[d.key]];
        return +d.value.normalized_count;

      }
      else {
        return +d.value.count;
      }
    })
    .on('preRender', function () {
      choro.calculateColorDomain();
    })
    .on('preRedraw', function () {
      choro.calculateColorDomain();
    })
    // TODO: this legend looks like shit
    .legend(dc_leaflet.legend().position('bottomright'))
    .featureKeyAccessor(function (feature) {
      return feature.properties.ward_en;
    })
    .popupMod('ctrlCmd')
    .renderPopup(true)
    .popup(function (d, feature) {
      return feature.properties.ward_en + " : " + d.value.count;
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
      choro.geojsonLayer().eachLayer(function (layer) { layer.setStyle(unhighlightedStyle); });
      _.each(nonmap_chartlist, function (chart) { chart.redraw(); });
    }
  });

  // Highlight map when mouse overward chart
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
          info.update(layer.feature.properties);
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
          info.update(layer.feature.properties);
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

  //Toggle reset text for individual chart
  // TODO: can this be moved outside this function?
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

  //Toggle Normalization Button
  var selection = d3.select('#norm-toggle');
  selection.on('change', function(){
    normalize = !(normalize);
    dc.redrawAll();
  });

  // Render all charts
  dc.renderAll();

  const callback = chart => entries => {
    redraw_chart_no_transitions(
        chart
            .width(null)
            .height(null)
            .rescale());
  };

  new ResizeObserver(callback(ageChart)).observe(d3.select('#age-chart').node());
  new ResizeObserver(callback(yearChart)).observe(d3.select('#year-chart').node());
  new ResizeObserver(callback(timeChart)).observe(d3.select('#time-chart').node());
  new ResizeObserver(callback(wardChart)).observe(d3.select('#ward-chart').node());
  // new ResizeObserver(callback(householdChart)).observe(d3.select('#household-chart').node());
  // new ResizeObserver(callback(genderChart)).observe(d3.select('#gender-chart').node());

  // Helper function to add x-axis labels
  function addXAxis(chartToUpdate, displayText) {
    chartToUpdate.svg()
              .append("text")
              .attr("class", "x-axis-label")
              .attr("text-anchor", "middle")
              .attr("x", chartToUpdate.width()/2)
              .attr("y", chartToUpdate.height()-7)
              .text(displayText);
  }

  // Add x axis labels
  addXAxis(wardChart, "Deaths");


}

