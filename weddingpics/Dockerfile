# Use the official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json ./
RUN bun install --frozen-lockfile

# Copy application code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Create uploads directory (will be mounted as volume)
RUN mkdir -p /app/uploads

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["bun", "run", "src/index.ts"]
