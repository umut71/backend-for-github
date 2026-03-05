FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client BEFORE copying source code
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/src/main.js"]
