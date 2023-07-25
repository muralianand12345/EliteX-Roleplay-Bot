from flask import Flask, request, jsonify
from flask_cors import CORS
from detoxify import Detoxify
import numpy as np

app = Flask(__name__)
CORS(app)
predictor = Detoxify('multilingual')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    sentence = data['sentence']
    results = predictor.predict(sentence)
    results = {k: v.item() if isinstance(v, np.float32) else v for k, v in results.items()}
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=25523)


# Note: You must run this in seperate instance or server. Also, change the port number.
# The "detoxify" uses AI TORCH and make sure you have atleast 10GB Local space and enough CPU power to keep running.