# Build stage
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set build argument for PocketBase URL
ARG VITE_POCKETBASE_URL
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

# Copy built files from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration as a template
COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80

# Use envsubst to replace specific environment variables in the nginx configuration
# We only replace VITE_ALI_LLM_URL and VITE_ALI_LLM_API_KEY to avoid breaking nginx's own variables like $uri
CMD ["/bin/sh", "-c", "envsubst '${VITE_ALI_LLM_URL} ${VITE_ALI_LLM_API_KEY}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
