FROM node:18-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server/ ./

# Start the server
CMD ["npm", "start"]

# Expose port 3001
EXPOSE 3001
