# Use an official Ubuntu 24.04 as a parent image
FROM ubuntu:24.04

# Install Node.js, Python, and other dependencies, including BLAS/LAPACK
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libatlas-base-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
