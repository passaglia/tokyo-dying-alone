
from flask import Flask
from flask import render_template, send_file
import os

# current directory
curr_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# Main route the user takes
@app.route("/")
def index():
    return render_template("index.html")

# Route to access death-at-home data
@app.route("/data/alone")
def get_data():

    filename = os.path.join(
        curr_dir, 'data/alone',
        'deaths_alone.gz') # This is compressed and will need to be decompressed in-browser

    return send_file(filename)

# Route to access ward list
@app.route("/data/wards")
def get_ward_data():

    filename = os.path.join(
        curr_dir, 'data/wards',
        'wards.geojson')
    
    return send_file(filename)

# Route to access total death list
@app.route("/data/total")
def get_total_death_data():

    filename = os.path.join(
        curr_dir, 'data/total',
        'shibou.json')
    
    return send_file(filename)

if __name__ == "__main__":
    app.run(host='127.0.0.0', port=5000, debug=True)
