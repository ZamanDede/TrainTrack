import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Set the working directory to the script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Load the dataset
file_path = '../../datasets/2/games.csv'  # Adjusted path for 2 folders deep
data = pd.read_csv(file_path)

# Select relevant features
data['rating_difference'] = data['white_rating'] - data['black_rating']
X = data[['white_rating', 'black_rating', 'rating_difference']]

# Encode the target variable ('winner') - we will encode 'white' as 1, 'black' as 0
y = data['winner'].apply(lambda x: 1 if x == 'white' else 0)

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Standardize the features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train the SVM model
model = SVC(kernel='linear')
model.fit(X_train, y_train)

# Save the model to a file
model_filename = 'svm_model.pkl'
scaler_filename = 'scaler.pkl'
joblib.dump(model, model_filename)
joblib.dump(scaler, scaler_filename)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

# Save the results to a text file
with open('metrics.txt', 'w') as f:
    f.write(f"Accuracy: {accuracy}\n")
    f.write("Classification Report:\n")
    f.write(report)
