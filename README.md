# Map of Tokyo

## Install Guide
First clone the git repository

Then go into the static folder and install all the javascript dependencies and packages with

```
npm init
```

To install a new package, go into /static/ and run

```
npm install --save packagename
```

## Run Guide
We will use flask which can be installed through pip3

in terminal, run

```
export FLASK_APP=app.py
python3 -m flask run
```

then open a browser to 127.0.0.1:5000

## Data Sources

The geographical locations of tokyo's wards are in the geojson format and come from https://github.com/dataofjapan/land/blob/master/tokyo.geojson . This file also includes the -shi which are not part of Tokyo-23, but we don't have death data for them.

The data about deaths alone originates from the Tokyo coroner's office. Their website https://www.fukushihoken.metro.tokyo.lg.jp/kansatsu/kodokushitoukei/index.html implies they have data for several years. However on that website the data is trapped in pdfs. 

On the open data catalog website https://catalog.data.metro.tokyo.lg.jp/, however, there are csv files for Heisei 28 (2016). I can ask for data from other years after getting the Heisei 28 data operation.

In particular the three data sets:

Deaths by age: https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d2000000166 . 
Here I add to url-hack to get the csv for each ward. Each ward is located at 
https://www.opendata.metro.tokyo.lg.jp/fukushihoken/R3/H28kodokushi0102_XX.csv
with XX = 01, 02, .., 23. There is a canonical mapping of the wards to digits, which is the last 2 digits of the postal code before the dash. In the geojson file the postal code is in the "code" field and the last two digits before the dash are in the [-3,-2] position because there is one digit after the dash included.

The CSV files are in the Shift JIS encoding. 

Time to discovery total (says Chiyoda-ku but I think it is total): https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d2000000167

Time to discovery by ward:
https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d2000000168

Population by ward: 
https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d1900000019

Deaths by Ward:
https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d0000000009/resource/99d5cb41-a30d-4d3e-85cc-cf316a2a7b26


## Data for future projects.

https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d1900000019

Average Age at marriage
https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d0000000009/resource/e24f4177-3d4a-497e-9c49-4252e8f19221


## Related tutorials 

http://adilmoujahid.com/posts/2016/08/interactive-data-visualization-geospatial-d3-dc-leaflet-python/

http://adilmoujahid.com/posts/2015/01/interactive-data-visualization-d3-dc-python-mongodb/

https://nickhand.github.io/blog/pages/2018/01/23/philly-parking/

the bootstrap explanation here is good: https://github.com/austinlyons/dcjs-leaflet-untappd

If I want to do some basic ML
https://code.visualstudio.com/docs/datascience/data-science-tutorial


## Potential future useful stuff

http://urbanspatialanalysis.com/blog/

https://opendata.dc.gov/pages/stories

https://github.com/DCgov

## To do

-- Fix the normalize somehow
https://stackoverflow.com/questions/22184013/dc-js-multiple-graphs-in-a-single-dimension

-- Make it easier to see absolute number of deaths. e.g. Add a total number of deaths display box 

-- Adjust chart style (x-axis, ticks, colors, etc)

-- Hide the age chart when time chart is selected and vice-versa

-- move my choropleth function to a standalone file / fork the git

-- clean up the code and add comments

-- lock map view?

-- Test deploy: Right now we're on passaglia.pythonanywhere.com but probably best to do github pages for which we have to staticify our app.
https://pythonhosted.org/Frozen-Flask/
https://stevenloria.com/hosting-static-flask-sites-on-github-pages/
https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages

right now if I go into build and run npx browser-sync start --server it works.

