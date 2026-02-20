# ---------- Build Stage ----------
FROM node:20-bullseye AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema so postinstall can run
COPY prisma ./prisma

# Install all dependencies (dev + prod)
RUN npm install

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript and generate Prisma client
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-bullseye

WORKDIR /app

# Copy package.json and only prod dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 5000

# Run Prisma migrations at container startup, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
