# Use official Node.js image with Alpine Linux for a smaller size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire project (excluding files in .dockerignore)
COPY . .

# Expose the application port
EXPOSE 5000

# Run the application
CMD ["node", "dist/index.js"]
