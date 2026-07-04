FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies using legacy peer deps to bypass peer conflicts
RUN npm install --legacy-peer-deps

# Copy workspace
COPY . .

# Expose NextJS port
EXPOSE 3000

# Start NextJS dev server
CMD ["npm", "run", "dev"]
