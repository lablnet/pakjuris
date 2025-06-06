FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json/pnpm-lock.yaml
COPY package*.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
# --frozen-lockfile is recommended for CI/CD to ensure deterministic builds
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN pnpm build

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["pnpm", "start"]
