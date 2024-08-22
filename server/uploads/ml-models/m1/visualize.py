import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

# Load the saved model and scaler
model_filename = 'svm_model.pkl'
scaler_filename = 'scaler.pkl'
model = joblib.load(model_filename)
scaler = joblib.load(scaler_filename)

# Load the dataset
file_path = '../../datasets/ds1/chess-games.csv'
data = pd.read_csv(file_path)

# Select relevant features
data['rating_difference'] = data['white_rating'] - data['black_rating']
X = data[['white_rating', 'black_rating', 'rating_difference']]

# Encode the target variable ('winner') - we will encode 'white' as 1, 'black' as 0
y = data['winner'].apply(lambda x: 1 if x == 'white' else 0)

# Standardize the features
X_scaled = scaler.transform(X)

# Make predictions using the loaded model
y_pred = model.predict(X_scaled)

# Confusion Matrix
conf_matrix = confusion_matrix(y, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.savefig('confusion_matrix.png')  # Save the plot as an image file
plt.close()  # Close the figure to free up memory

# Visualizing the relationship between player ratings and the outcome
plt.figure(figsize=(10, 6))
sns.scatterplot(x=data['white_rating'], y=data['black_rating'], hue=y_pred, palette='coolwarm', alpha=0.7)
plt.title('Scatter Plot of White vs. Black Ratings with Predicted Outcomes')
plt.xlabel('White Player Rating')
plt.ylabel('Black Player Rating')
plt.savefig('rating_scatter_plot.png')  # Save the plot as an image file
plt.close()  # Close the figure to free up memory
