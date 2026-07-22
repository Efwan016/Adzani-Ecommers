# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage with a tiny static server
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/dist /app/dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# SPA fallback so client-side routes resolve on refresh
CMD ["serve", "-s", "dist", "-l", "3000"]
