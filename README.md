<a href="https://passaglia.jp/tokyo-dying-alone"> <img src="/img/tokyo-dying-alone-header.png" height="200"/> </a>

[Tokyo Dying Alone](https://passaglia.jp/tokyo-dying-alone/) is a visualization of data surrounding the lonely death problem in Tokyo, Japan. An [accompanying blog post](/tokyo-dying-alone-guide/) provides a non-technical discussion of the project and an analysis of the data. This [github repository](https://github.com/passaglia/tokyo-dying-alone/) hosts the project source code, and this readme serves as a technical overview of the project. 

The project uses data from the [Tokyo Medical Examiner's Office](https://www.fukushihoken.metro.tokyo.lg.jp/kansatsu/kodokushitoukei/index.html) and the [Tokyo Bureau of Social Welfare and Public Health](https://www.fukushihoken.metro.tokyo.lg.jp/kiban/chosa_tokei/jinkodotaitokei/kushityosonbetsu.html). The data was extracted with [tabula](https://tabula.technology/) and [excalibur](https://excalibur-py.readthedocs.io/en/master/), and the data processing is done with [pandas](https://pandas.pydata.org/). The dashboard is made up of responsive [dc.js](https://dc-js.github.io/dc.js/) charts built using [crossfilter](https://github.com/crossfilter/crossfilter). [Leaflet](https://leafletjs.com/) is used to load a map, and a custom modification of the [dc-leaflet](https://github.com/dc-js/dc.leaflet.js) package is used to integrate the map with the charts. The website is laid out using [bootstrap](https://getbootstrap.com/) and is developed as a [Flask](https://flask.palletsprojects.com/en/2.0.x/) app. [Frozen-Flask](https://pythonhosted.org/Frozen-Flask/) is used to convert the app into a static site which is hosted using [Github Pages](https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages). Data is decompressed in browser using [fflate](https://github.com/101arrowz/fflate).

## Extracting, Cleaning, and Reorganizing the Data

For each of Tokyo's 23 wards and for each year from Heisei 15 (2003) to the first year of Reiwa (2019), the Tokyo Medical Examiner's Office [supplies two tables of summary data](https://www.fukushihoken.metro.tokyo.lg.jp/kansatsu/kodokushitoukei/index.html): an age table showing the number of deaths at home broken down into bins of sex, household status, and age of the deceased in 5-year age brackets; and a time-to-discovery table showing the number of deaths broken down into bins of sex, household status, and number of days until the deceased was discovered. In total 782 tables cover the deaths of 119,877 people.

The tables for Heisei 28 (2016) are supplied in a machine-readable .csv format in two Tokyo Open Data Catalog datasets ([age](https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d2000000166) and [days-to-discovery](https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d2000000168)). The rest of the data is trapped in pdfs on the Medical Examiner's website and had to be extracted with the [tabula](https://tabula.technology/) software. The pdf for Heisei 22 suffers from an encoding issue I handled with the [excalibur](https://excalibur-py.readthedocs.io/en/master/) package. A few tables are supplied only as scans and had to be input by hand. 

All the extracted tables can be found in `/data/rawdata/[year]/age/` and `/data/rawdata/[year]/time/`. There is one csv file per ward, and wards are indexed 0-22 based on the municipal codes between 1 and 23 which are assigned to each ward. This and geographic information about each ward can be found in `/data/wards/wards.geojson`, a slightly modified version of the file provided by the [dataofjapan](https://github.com/dataofjapan/land) repository. For Heisei 28, the files are directly indexed 1-23 rather than 0-22. 

The `clean_data` python script loads in all the tables as [pandas](https://pandas.pydata.org/) dataframes and performs some cleaning and reorganizing of the data. The two-tables-per-ward-per-year setup is useful for finding typos and inconsistencies in the provided data, and in particular the script corrects some issues in the age table for Taito ward in Heisei 19. There are also inconsistencies in the data for 36 people in Reiwa 1 which cannot be unambiguously fixed and the script makes some arbitrary choices there to enforce internal data consistency.

Once the data is cleaned, however, dealing with 782 separate tables is cumbersome. The script therefore generates a single list containing one entry for each of the 119,877 deaths at home in Tokyo between 2003 and 2019. Each entry contains the year, ward, sex, household status, age bracket, and days-to-discovery of a deceased person. Because the original data does not contain the cross-dimension of age-bracket and days-to-discovery information, I matched that information arbitrarily in my list. The entries in the list therefore do not correspond to real people who died in Tokyo: instead, the death list is a useful fiction which reproduces exactly the statistics in the Medical Examiner's tables. 

This reorganizing makes handling the data much more straightforward. It is compressed as a gzip archive and saved to `/data/alone/deaths_alone.gz`.

The relative populations of different wards and their change over time can be accounted for if one knows the total number of deaths -- including those not at home -- in each year for each ward. This is provided by [a Tokyo Open Data Catalog dataset](https://catalog.data.metro.tokyo.lg.jp/dataset/t000010d0000000009/resource/99d5cb41-a30d-4d3e-85cc-cf316a2a7b26) from the Tokyo Bureau of Social Welfare and Public Health, saved here in `/data/rawdata/shibou.csv`. `clean_data.py` also does some processing of that file and outputs it as `/data/total/shibou.json`.

## Setting up of the website

The dashboard is developed as a [Flask](https://flask.palletsprojects.com/en/2.0.x/) app. The app.py file defines a route to the index page stored in `/templates/index.html` that the user is served, as well as routes to the three data files which the main charting script`/static/js/main.js` accesses: `/data/alone` leads to the full deaths at home data, `/data/total` leads to the statistics about total deaths including those not at home, and `/data/wards` leads to the geographic information about the wards.

The `index.html` file sets up the grid in which the charts are placed. This grid is generated using [bootstrap](https://getbootstrap.com/). Additional css is contained in `/static/custom.css`.

To run the app as a flask app, in the root directory run

```
export FLASK_APP=app.py
python3 -m flask run
```

and then open a browser to [127.0.0.1:5000](http://127.0.0.1:5000).

There's an minor issue that surfaced here late in the project and that I haven't yet fixed. To serve the data quickly, it is sent to the user compressed and then unpacked in the browser using [fflate](https://github.com/101arrowz/fflate). However, when run as a flask app the browser sometimes automatically decompresses the file itself which then leads to errors in fflate. This doesn't seem to happen once the app is frozen and deployed, and so I haven't gotten around to fixing this issue yet.

[Frozen-Flask](https://pythonhosted.org/Frozen-Flask/) is used to convert the Flask app into a static site which can be hosted using [Github Pages](https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages).

The build is generated by running

```
python3 freeze.py
```

This build can then be tested locally by entering `/build` and running

``` 
npx browser-sync start --server
```

and then opening a browser window to the `localhost`.

The `deploy.sh` shell script automates deployment as a Github Page by pushing the build folder to the `gh-pages` branch of this repository.

## Generating the dashboard

The dashboard charts are built with the [crossfilter](https://github.com/crossfilter/crossfilter) javascript library, which enables extremely fast responses to user interaction with [dc.js](https://dc-js.github.io/dc.js/) charts. This allows the data to be charted in the browser and then filtered by the user along all the different data dimensions as they explore the visualization. 

As the data is filtered by the user, two crossfilter `numberDisplay` instances at the top of the page show the number of deaths in the current data slice, as well as the number of deaths as a fraction of all deaths (including those not at home). The total number of deaths is obtained from the `/data/total` data route.

The charts and displays are all defined in `main.js`. Here I highlight some unique features of each chart.

The gender and household status charts are the most straightforward. They are simple instances of crossfilter's `barChart`. Because they have only two bars (men/women for the gender chart and alone/with Others for the household chart), it makes the most sense to restrict these charts to host only one filter at a time.  This is achieved with a filter handler added using `addFilterHandler`. These charts, and all the other ones, also have `on('filtered')` actions which show or hide chart reset buttons when the chart is filtered.

The age chart is also a simple bar chart. Here there are many columns, and the columns are ordered from young to old. Therefore the chart is set to be 'brushable,' which is the crossfilter jargon for selecting multiple bars at once to include in the filter by clicking and dragging. Another special feature of this chart is that when it is filtered, an `on('filtered')` action hides the time-to-discovery chart. This is because the age/time-to-discovery cross-dimension is not given by the public data. Likewise when the time-to-discovery chart is filtered, this chart is hidden.

The time-to-discovery chart is very similar to the age chart. Due to a quirk in how crossfilter handles data like '0-1' days, under the hood the data here is remapped to integers: '0-1' days becomes 1, '2-3' becomes 2, '4-7' becomes 3, and so forth. When the bar labels are then generated, a special function maps the integers back to the day ranges.

The year chart is again a brushable bar chart. The plot title is a [bootstrap-toggle](https://www.bootstraptoggle.com/). When the toggled is clicked, an event is triggered that is captured in main.js and changes the value of a flag variable. Based on the value of variable, the chart `valueAccessor`  displays either the number of deaths at home by year, or the number of deaths at home divided by the total deaths that year. Note also that when the year range is restricted, the total deaths including those not at home used in computing the fraction-of-all-deaths indicator also changes accordingly.

Finally, the most complicated chart is the map. The map is loaded using the [leaflet](https://leafletjs.com/) library, and the color overlay is a choropleth chart from a custom modification of the [dc-leaflet](https://github.com/dc-js/dc.leaflet.js) package. The color overlay shows the number of deaths at home in each ward for the current data slicing, also shown in the adjacent ward chart.

As the user moves the cursor over the map, the hovered-over ward becomes outlined, all the charts are updated to show only the information from that ward, and the ward is highlighted in the neighboring ward chart. A legend also updates to shows the summary data for that ward. Clicking on a ward locks all the charts to that ward, so that further moving of the mouse does not change the selected ward. Clicking again undoes the lock. These interactions are achieved with mouseover events on each element of the geojson layer of the map, which the custom [dc-leaflet] modification exposes.

Likewise interacting with the ward chart updates the map. The title of the ward chart another toggle, which switches the chart and the map from showing the number of deaths at home to showing the number of deaths at home as a fraction of all deaths.

## Acknowledgements

This project relied on data gathered by Yoshimasa Kanawaku 金涌佳雅, Takanobu Tanifuji 谷藤隆信, Nobuyuki Abe 阿部伸幸, Ichiro Nozaki 野崎一郎, Mori Shinjiro 森晋二郎, Masato Funayama 舟山眞人, and Tatsushige Fukunaga 福永龍繁, of the Tokyo Medical Examiner's Office.

Tutorials from [Adil Moujahid](http://adilmoujahid.com/posts/2016/08/interactive-data-visualization-geospatial-d3-dc-leaflet-python/), [Nick Hand](https://nickhand.github.io/blog/pages/2018/01/23/philly-parking/), and [Austin Lyons](https://github.com/austinlyons/dcjs-leaflet-untappd), as well as the dc.js and crossfilter Stack Exchange communities including the invaluable contributions by [Gordon Woodhull](https://stackoverflow.com/users/676195/gordon), were essential for learning the tools used here.


