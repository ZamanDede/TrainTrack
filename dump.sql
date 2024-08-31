CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_type VARCHAR(50) NOT NULL,
    CHECK (user_type IN ('admin', 'premium', 'regular'))
);

CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX users_username_key ON users(username);

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    path VARCHAR(255) NOT NULL,
    info JSONB
);

CREATE INDEX datasets_pkey ON datasets(id);
