Assignment 1 - Web Server - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Yaman Tosunoglu
- **Student number:** N11357428
- **Application name:** TrainTrack
- **Two line description:** TrainTrack is a machine learning management platform where users can upload datasets, run and visualize machine learning models, and manage their training results. The application provides a user-friendly web interface with role-based access to features, catering to different user levels such as regular, premium, and admin.


Core criteria
------------------------------------------------

### Docker image

- **ECR Repository name:** N11357428(TrainTrack)
- **Video timestamp:** 0.20
- **Relevant files:**
    - /Dockerfile
    - /docker-compose.yml
    - /.dockerignore

### Docker image running on EC2

- **EC2 instance ID:** i-09e878e41634e83fe
- **Video timestamp:** 1.00

### User login functionality

- **One line description:** User login functionality is implemented using PostgreSQL to store user credentials, and JWT for session management.
- **Video timestamp:** 1.25
- **Relevant files:**
    - server/routes/users.js - Handles user registration, login, and session management.
    - server/auth.js - Contains the JWT generation, authentication middleware, and role enforcement functions.
    - Client/views/login.ejs - The front-end form for user login.
    - Client/views/register.ejs - The front-end form for user registration.

### User dependent functionality

- **One line description:** The application provides different functionalities based on user roles: regular users can view datasets and models, premium users can run and visualize models and upload datasets, while admins have access to user management features.
- **Video timestamp:** Regular user(1.33), Premium user(2.20), Admin(3.20)
- **Relevant files:**
    - server/routes/users.js - Defines role-based access control and user management.
    - server/routes/dataset.js - Manages datasets with access depending on user roles.
    - server/routes/model.js - Handles model visualization and execution, accessible to premium users.
    - Client/views/users.ejs - Admin-only page for managing users.
    - Client/views/upload-datasets.ejs - Upload datasets page, accessible to premium users.

### Web client

- **One line description:** The web client is a server-side rendered application using EJS templates, styled with Bootstrap and custom CSS, and enhanced with plain JavaScript for dynamic interactions.
- **Video timestamp:** 1.15
- **Relevant files:**
    - Client/views/ - Contains EJS templates for rendering HTML pages.
    - Client/public/css/ - Custom CSS files for styling the web client.
    - Client/public/js/ - JavaScript files for dynamic behavior on the client side.

### REST API

- **One line description:** The REST API is implemented with Express.js, providing endpoints for managing users, datasets, and models, with proper HTTP methods.
- **Video timestamp:** 3.45
- **Relevant files:**
    - server/app.js - The main Express application file that integrates all the routes.
    - server/routes/users.js - Handles user-related operations like registration, login, and user management.
    - server/routes/dataset.js - Manages dataset-related operations, such as uploading and listing datasets.
    - server/routes/model.js - Manages model-related operations, including running models and visualizing results.

### Two kinds of data

#### First kind

- **One line description:** One line description: Dataset files and model outputs (e.g., CSV files, images, Python scripts)
- **Type:** Unstructured
- **Rationale:** These files are large and varied in format (e.g., images, CSV files, Python scripts). They are stored directly in the file system rather than in the database because they don't require complex queries or transactions.
- **Video timestamp:** 5.20
- **Relevant files:**
    - server/uploads/datasets/ - Directory containing uploaded datasets.
    - server/uploads/ml-models/ Directory containing model-related files (e.g., Python scripts).

#### Second kind

- **One line description:** Metadata for datasets and models, and user ownership information
- **Type:** Structured, no ACID requirements
- **Rationale:** The metadata and user information are stored in the PostgreSQL database, allowing for efficient querying and management. These data types are relatively small and do not require complex transactional integrity, making them ideal for structured storage in a database.
- **Video timestamp:** 4.53
- **Relevant files:**
  - server/db.js - Manages database connections and queries.
  - server/routes/dataset.js - Stores dataset metadata (e.g., file paths, creation timestamps) in the database.
  - server/routes/users.js - Handles user-related operations, storing user details in the database.

### CPU intensive task

- **One line description:** Execution of a machine learning model using transfer learning, which generates high CPU load.
- **Video timestamp:** 5.48
- **Relevant files:**
    - server/uploads/ml-models/m2/model.py - The Python script that runs the transfer learning model.

### CPU load testing method

- **One line description:** User-triggered execution of the transfer learning model via the web interface, generating sustained CPU load over a period of 5-10 minutes.
- **Video timestamp:** 5.48
- **Relevant files:**
    - server/routes/model.js - Contains the endpoint that triggers the CPU-intensive ML model execution.
    - Client/views/model.ejs - The web page with a button to trigger model execution and visualization.


Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Implemented sorting, JWT-based authentication, advanced file handling with Multer, and integration of unstructured and structured data.
- **Video timestamp:** 3.45
- **Relevant files:**
    - server/routes/users.js - Contains sorting of users by type and username.
    - server/routes/dataset.js - Demonstrates advanced file handling, including ZIP file uploads, extraction, and database integration.
    - server/auth.js - Implements JWT-based authentication for secure access to API routes.

### Use of external API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    -


### Extensive web client features

- **One line description:** Custom-styled multi-page application with advanced search, filtering, and sorting functionality, using Bootstrap for responsive design and EJS templates for dynamic rendering.
- **Video timestamp:** 1.53
- **Relevant files:**
    - Client/public/css/pages/ - Contains custom CSS files for styling various pages.
    - Client/public/js/datasetPresentation.js - Implements search, filtering, and sorting for datasets.
    - Client/public/js/modelStatus.js - Manages the status of model execution and updates the UI with a timer.
    - Client/views/ - EJS templates for rendering the web client with dynamic content.


### Sophisticated data visualisations

- **One line description:** Visualization scripts for ML models (m1 and m2) generate and display data visualizations, including confusion matrices, precision-recall curves, and training history, which can be triggered automatically on the model page.
- **Video timestamp:** 2.46
- **Relevant files:**
    - server/uploads/ml-models/m1/visualize.py - Generates visualizations for the m1 model.
    - server/uploads/ml-models/m2/visualize.py - Generates visualizations for the m2 model.
    - Client/public/js/modelStatus.js - Manages the visualization status and updates the UI.
    - server/routes/model.js - Contains the endpoints that trigger the visualization scripts.


### Additional kinds of data
- **One line description:** Model performance metrics and visualizations (e.g., PNG files, text-based metrics)
- **Type:** Unstructured
- **Rationale:** These files are generated by the model execution scripts and provide critical insights into the model's performance. They are stored separately as they need to be accessed and visualized independently of the primary data and metadata.
- **Video timestamp:** 5.30
- **Relevant files:**
  - server/uploads/ml-models/m1/metrics.txt - Stores the text-based performance metrics for a specific model.
  - server/uploads/ml-models/m1/confusion_matrix.png - Image file generated to visualize model performance.
  - server/uploads/ml-models/m1/visualize.py - Python script that generates visualizations.



### Significant custom processing

- **One line description:** Two custom ML models implemented; one is a deep learning model using transfer learning, and the other is a support vector machine (SVM) model.
- **Video timestamp:** 2.46 (Scripts themselves are not shown in the video but all 4 scripts I run is custom training and visualization code)
- **Relevant files:**
    - server/uploads/ml-models/m1/model.py - Custom script for the SVM model training and prediction.
    - server/uploads/ml-models/m2/model.py - Custom script for the deep learning model using transfer learning.
    - server/uploads/ml-models/m1/visualize.py - Generates visualizations specific to the SVM model.
    - server/uploads/ml-models/m2/visualize.py - Generates visualizations specific to the transfer learning model.
    - server/routes/model.js - Contains endpoints for executing the custom models and triggering training.



### Live progress indication

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    -


### Infrastructure as code

- **One line description**: Docker Compose setup for running the Express application with a PostgreSQL database, ensuring consistent and reproducible infrastructure.
- **Video timestamp:** 0.35
- **Relevant files:**
    - docker-compose.yml - Defines the Docker services for the Express application and PostgreSQL database.
    - Dockerfile - Specifies the environment setup for the Express application, including dependencies like Node.js and Python.



### Other

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    -
