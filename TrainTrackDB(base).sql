-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the models table
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_models table
CREATE TABLE user_models (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    model_id INT REFERENCES models(id) ON DELETE CASCADE,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, model_id)
);

-- Create the datasets table
CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_datasets table
CREATE TABLE user_datasets (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, dataset_id)
);

-- Create the training_sessions table
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    model_id INT REFERENCES models(id),
    dataset_id INT REFERENCES datasets(id),
    status VARCHAR(50) DEFAULT 'in progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metrics JSONB  -- Or TEXT if JSONB is not supported
);
