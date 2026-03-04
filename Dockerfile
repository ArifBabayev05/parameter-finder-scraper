# Dockerfile for Puppeteer and Node.js
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV HEADLESS=true
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the server
CMD ["node", "server.js"]
