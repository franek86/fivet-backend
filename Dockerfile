# ---------- BUILD STAGE ----------
# Use official Node.js image with Alpine Linux for a smaller size
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json .

# Install dependencies
RUN npm install

COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy build files and prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose the application port
EXPOSE 5000

# Run the application
CMD ["node", "dist/index.js"]
