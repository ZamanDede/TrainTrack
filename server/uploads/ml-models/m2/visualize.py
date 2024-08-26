import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, roc_curve, auc
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Set the working directory to the script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Load the dataset paths
train_dir = '../../datasets/34/train'  # Path to the training set

# Load the training CSV file
train_csv_path = '../../datasets/34/Training_set.csv'
train_labels = pd.read_csv(train_csv_path)

# Create a dictionary to map filenames to their labels
label_mapping = {row['filename']: row['label'] for index, row in train_labels.iterrows()}

# Prepare the class indices based on the labels in the CSV
class_indices = {label: idx for idx, label in enumerate(train_labels['label'].unique())}

# Define a function to process images and map them to labels
def load_and_preprocess_image(filename, label, target_size=(32, 32)):
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

# Compute the confusion matrix
cm = confusion_matrix(y_true_classes, y_pred_classes)

# Plot Confusion Matrix with improved readability
plt.figure(figsize=(12, 10))  # Increase figure size
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=list(class_indices.keys()))
disp.plot(cmap=plt.cm.Blues)

# Adjustments for readability
plt.xticks(rotation=45, ha='right', fontsize=10)  # Rotate x-axis labels and adjust font size
plt.yticks(fontsize=10)  # Adjust font size of y-axis labels
plt.title('Confusion Matrix', fontsize=15)
plt.xlabel('Predicted Label', fontsize=12)
plt.ylabel('True Label', fontsize=12)
plt.tight_layout()  # Adjust layout to prevent clipping
plt.savefig('confusion_matrix.png')

# Plot ROC Curve and AUC for each class
fpr = {}
tpr = {}
roc_auc = {}

plt.figure(figsize=(10, 8))

for i in range(len(class_indices)):
    fpr[i], tpr[i], _ = roc_curve(y_train[:, i], y_pred[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])
    plt.plot(fpr[i], tpr[i], label=f'Class {i} (AUC = {roc_auc[i]:.2f})')

plt.plot([0, 1], [0, 1], 'k--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc='lower right')
plt.savefig('roc_curve.png')
