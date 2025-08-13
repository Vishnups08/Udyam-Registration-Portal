# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app/backend

# Install backend deps
COPY backend/package*.json ./
RUN npm install

# Copy source
COPY backend .

# Build (includes prisma generate via package.json)
RUN npm run build

ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/server.js"] 