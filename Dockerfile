# Use Debian-based Node for Prisma compatibility
FROM node:24-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Copy Prisma schema so postinstall can run
COPY prisma ./prisma

# Install all dependencies (dev + prod) for build
RUN npm install

# Copy app files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies to slim image
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/index.js"]