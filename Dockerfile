FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY chess-app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY chess-app/ ./

# Build the app
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build", "-l", "3000"]
