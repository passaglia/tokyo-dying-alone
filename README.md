# Dying alone in Tokyo, Japan

A data visualization about the `Lonely death' problem in Tokyo, available at [passaglia.jp/tokyo-dying-alone](http://passaglia.jp/tokyo-dying-alone).

The dashboard is built with [dc.js](https://dc-js.github.io/dc.js/), [crossfilter](https://github.com/crossfilter/crossfilter), and[leaflet](https://leafletjs.com/). The data cleaning uses [pandas](https://pandas.pydata.org/).

## Running the dashboard locally

The dashboard can be run locally using the [Flask](https://flask.palletsprojects.com/en/2.0.x/) python framework.

To do so, in the root directory open a terminal and run

```
export FLASK_APP=app.py
python3 -m flask run
```

and then open a browser to 127.0.0.1:5000

## Deploying as a static site

[Frozen-Flask](https://pythonhosted.org/Frozen-Flask/) is used to convert the Flask app into a static site which is hosted using [Github Pages](https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages).

The build can be tested locally by entering /build and running

``` 
npx browser-sync start --server
```

## To do

-- Confirm normalize vs some thing from the pdf

-- move my choropleth function to a standalone file / fork the git

-- clean up the code and add comments

-- Reorganize all the libraries

