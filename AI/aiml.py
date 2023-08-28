import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from data.dataset import data

# Separate text and labels
texts = [item[0] for item in data]
labels = [item[1] for item in data]

# Convert labels to binary values (0 for non-informative, 1 for informative)
label_mapping = {"non-informative": 0, "informative": 1}
binary_labels = np.array([label_mapping[label] for label in labels])

# Split dataset into train and test sets
train_texts, test_texts, train_labels, test_labels = train_test_split(texts, binary_labels, test_size=0.2, random_state=42)

# Vectorize text data using TF-IDF
vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
train_vectors = vectorizer.fit_transform(train_texts)
test_vectors = vectorizer.transform(test_texts)

# Train a Support Vector Machine classifier
classifier = SVC(kernel='linear', random_state=42)
classifier.fit(train_vectors, train_labels)

# Make predictions
predictions = classifier.predict(test_vectors)

# Calculate accuracy
accuracy = accuracy_score(test_labels, predictions)
print("Accuracy:", accuracy)
