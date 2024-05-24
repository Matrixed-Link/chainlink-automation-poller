# Use the official Node.js 22.1.0 image as a parent image
FROM node:22.1.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's source code from your host to your image filesystem
COPY . .

# Copy the .env file
COPY .env .

# DEBUG
RUN ls -la /usr/src/app

# Expose the port from the environment variable
EXPOSE ${PORT:-8080}

# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "--no-deprecation", "app.js" ]
