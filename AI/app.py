from flask import Flask, request, jsonify
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

import mariadb
import sys
import json

f = open("sql.json", "r")
data = json.loads(f.read())

try:
    conn = mariadb.connect(
        user=data['USERNAME'],
        password=data['PASSWORD'],
        host=data['HOST'],
        port=data['PORT'],
        database=data['DATABASE']
    )
except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
    sys.exit(1)

cur = conn.cursor()

app = Flask(__name__)

model_filename = './modals/icrp_model2.pkl'
loaded_classifier = joblib.load(model_filename)

vectorizer_filename = './modals/tfidf_vectorizer.pkl'
vectorizer = joblib.load(vectorizer_filename)


@app.route('/darkchatpredict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        input_message = data['MessageContent']

        input_vector = vectorizer.transform([input_message])
        prediction = loaded_classifier.predict(input_vector)

        predicted_label = "informative" if prediction == 1 else "non-informative"
        
        cur.execute("CREATE TABLE IF NOT EXISTS chat_predictions (id SERIAL PRIMARY KEY, message TEXT, predicted_label TEXT)")
        cur.execute("INSERT INTO chat_predictions (message, predicted_label) VALUES (?, ?)", (input_message, predicted_label))
        conn.commit()
        
        return jsonify({'predicted_label': predicted_label})
    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
