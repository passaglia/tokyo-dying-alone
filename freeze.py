from flask_frozen import Freezer
from app import app

app.config['FREEZER_REMOVE_EXTRA_FILES'] = False
freezer = Freezer(app)

if __name__ == '__main__':
    freezer.freeze()