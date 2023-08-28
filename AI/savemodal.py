import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
import joblib
from data.dataset import data

texts = [item[0] for item in data]
labels = [item[1] for item in data]

label_mapping = {"non-informative": 0, "informative": 1}
binary_labels = np.array([label_mapping[label] for label in labels])

train_texts, _, train_labels, _ = train_test_split(texts, binary_labels, test_size=0.2, random_state=42)

vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
train_vectors = vectorizer.fit_transform(train_texts)

classifier = SVC(kernel='linear', random_state=42)
classifier.fit(train_vectors, train_labels)

# Save the trained model to a file
model_filename = './modals/icrp_model2.pkl'
joblib.dump(classifier, model_filename)
print("Model saved successfully.")

vectorizer_filename = './modals/tfidf_vectorizer.pkl'
joblib.dump(vectorizer, vectorizer_filename)
print("Vectorizer saved successfully.")