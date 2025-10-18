# --- Base image with Node and Playwright ---
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install npm dependencies
RUN npm install --omit=dev

# --- Install Playwright browsers and dependencies ---
RUN npx playwright install chromium && \
    npx playwright install-deps

# Copy the rest of the project files
COPY . .

# Expose server port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the Playwright API server
CMD ["node", "server.js"]
