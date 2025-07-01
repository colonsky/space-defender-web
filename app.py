from flask import Flask, render_template, send_from_directory
from flask_compress import Compress
import os

app = Flask(__name__)

# Performance optimizations
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year cache
Compress(app)  # Enable gzip compression

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files with proper caching headers"""
    response = send_from_directory('static', filename)
    response.cache_control.max_age = 31536000  # 1 year cache
    response.cache_control.public = True
    return response

if __name__ == '__main__':
    # Production-ready settings
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port, threaded=True)