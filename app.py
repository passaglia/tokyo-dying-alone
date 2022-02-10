import pandas as pd
import json
from flask import Flask
from flask import render_template, request
import os

# current directory
curr_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# Main route the user takes
@app.route("/")
def index():
    return render_template("index.html")

# Route to access alone death data
@app.route("/data/alone")
def get_data():

    # Load in the json file we made with clean_data.py
    filename = os.path.join(
        curr_dir, 'data/alone',
        'deaths_alone.json.gz')
    df = pd.read_json(filename, dtype=False)

    # return it 
    return df.to_json(orient='records')

# Route to access ward list
@app.route("/data/wards")
def get_ward_data():

    # Load in the json file
    filename = os.path.join(
        curr_dir, 'data/wards',
        'wards.geojson')
        
    return json.load(open(filename))


# Route to access death list
@app.route("/data/total")
def get_total_death_data():

    # Load in the json file
    filename = os.path.join(
        curr_dir, 'data/total',
        'shibou.json')
    
    # return it 
    return json.load(open(filename))


if __name__ == "__main__":
    app.run(host='127.0.0.0', port=5000, debug=True)
