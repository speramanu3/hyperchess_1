FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server using compiled JavaScript
CMD ["npm", "start"]
