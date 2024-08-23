import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import matplotlib.pyplot as plt

# Set the working directory to the script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Load the dataset paths
train_dir = '../../datasets/ds2/train'  # Path to the training set

# Load the training CSV file
train_csv_path = '../../datasets/ds2/Training_set.csv'
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

# Load the base model (EfficientNetB0)
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(32, 32, 3))

# Unfreeze the last few layers of the base model
for layer in base_model.layers[-20:]:
    layer.trainable = True

# Add custom layers on top of the base model
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x)
predictions = Dense(len(train_labels['label'].unique()), activation='softmax')(x)  # Adjust output layer to match the number of classes

# Create the model
model = Model(inputs=base_model.input, outputs=predictions)

# Compile the model
model.compile(optimizer=tf.keras.optimizers.Adam(),
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Train the model without validation
history = model.fit(
    X_train, y_train,
    epochs=3,  # Adjust the number of epochs as needed
    batch_size=8  # Adjust the batch size as needed
)

# Save the training history as a PNG image
plt.figure(figsize=(10, 5))
plt.plot(history.history['accuracy'], label='Accuracy')
plt.plot(history.history['loss'], label='Loss')
plt.title('Training History')
plt.xlabel('Epoch')
plt.ylabel('Value')
plt.legend()
plt.savefig('training_history.png')


from sklearn.metrics import classification_report

# Generate predictions for the training data
y_pred = model.predict(X_train)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true_classes = np.argmax(y_train, axis=1)

# Generate a classification report
report = classification_report(y_true_classes, y_pred_classes, target_names=class_indices.keys())

# Save the final metrics and classification report to a text file
final_accuracy = history.history['accuracy'][-1]
final_loss = history.history['loss'][-1]

with open('metrics.txt', 'w') as f:
    f.write(f"Final Accuracy: {final_accuracy:.4f}\n")
    f.write(f"Final Loss: {final_loss:.4f}\n\n")
    f.write("Classification Report:\n")
    f.write(report)

# Save the model to a file
model.save('trained_model.h5')
