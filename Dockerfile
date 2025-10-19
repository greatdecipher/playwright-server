# --- Base image with Node and Playwright ---
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

# Set working directory
WORKDIR /app

# Copy package files first (for build cache)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of your project files
COPY . .

# Expose server port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the Playwright API server
CMD ["node", "server.js"]
