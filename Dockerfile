# Use the official Node.js 22.1.0 image as a parent image
FROM node:22.1.0

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the set_env.sh script
COPY set_env.sh .

# Ensure set_env.sh is executable
RUN chmod +x set_env.sh

# Install jq for JSON parsing
RUN apt-get update && apt-get install -y jq

# Expose the port read from the config file
CMD ["sh", "-c", "./set_env.sh && node --no-deprecation app.js"]