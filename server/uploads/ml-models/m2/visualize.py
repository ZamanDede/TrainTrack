import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
import seaborn
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, roc_curve, auc
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Set the working directory to the script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Load the dataset paths
# Construct the absolute paths for the dataset using the script's location
dataset_id = '58'  # Replace this with dynamic input if required
train_dir = os.path.join(script_dir, '../../../../efs/datasets', dataset_id, 'train')  # Path to the training set
train_csv_path = os.path.join(script_dir, '../../../../efs/datasets', dataset_id, 'Training_set.csv')

# Check if the dataset paths exist
if not os.path.exists(train_dir):
    raise FileNotFoundError(f"Training directory not found at {train_dir}")

if not os.path.exists(train_csv_path):
    raise FileNotFoundError(f"Training CSV file not found at {train_csv_path}")

# Load the training CSV file
train_labels = pd.read_csv(train_csv_path)

# Create a dictionary to map filenames to their labels
label_mapping = {row['filename']: row['label'] for index, row in train_labels.iterrows()}

# Prepare the class indices based on the labels in the CSV
class_indices = {label: idx for idx, label in enumerate(train_labels['label'].unique())}

# Define a function to process images and map them to labels
def load_and_preprocess_image(filename, label, target_size=(75,75)):
    img = load_img(os.path.join(train_dir, filename), target_size=target_size)
    img = img_to_array(img)
    label_encoded = tf.keras.utils.to_categorical(class_indices[label], num_classes=len(class_indices))
    return img, label_encoded

# Prepare the training data and labels
X_train = []
y_train = []

for index, row in train_labels.iterrows():
    filename = row['filename']
    label = row['label']
    img, label_encoded = load_and_preprocess_image(filename, label)
    X_train.append(img)
    y_train.append(label_encoded)

X_train = np.array(X_train)
y_train = np.array(y_train)

# Load the trained model
model = load_model('trained_model.h5')

# Generate predictions for the training data
y_pred = model.predict(X_train)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true_classes = np.argmax(y_train, axis=1)


# Parts to change
from sklearn.metrics import precision_recall_curve, average_precision_score

# Aggregate Precision-Recall Curve
y_train_reshaped = y_train.ravel()
y_pred_reshaped = y_pred.ravel()
precision, recall, _ = precision_recall_curve(y_train_reshaped, y_pred_reshaped)
average_precision = average_precision_score(y_train, y_pred, average="micro")

# Plot Average Precision-Recall Curve
plt.figure(figsize=(10, 6))
plt.plot(recall, precision, label=f'Precision-Recall Curve (AP = {average_precision:.2f})', color='green')
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Overall Precision-Recall Curve')
plt.legend(loc='lower left')
plt.savefig('precision_recall_curve.png')
