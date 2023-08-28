from flask import Flask, request, jsonify
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load the saved model from file
model_filename = './modals/icrp_model2.pkl'
loaded_classifier = joblib.load(model_filename)

# Load the vectorizer used during training
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
        return jsonify({'predicted_label': predicted_label})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
