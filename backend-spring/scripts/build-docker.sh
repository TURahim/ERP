#!/bin/bash
# Build Docker image for ERP Backend

echo "Building ERP Backend Docker Image..."
echo "===================================="
echo ""

cd "$(dirname "$0")/.."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Install Docker: https://www.docker.com/get-started"
    exit 1
fi

echo "✅ Docker is available"
echo ""

# Clean and build JAR first
echo "1. Building JAR with Maven..."
./mvnw clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "❌ Maven build failed"
    exit 1
fi
echo "✅ JAR built successfully"
echo ""

# Build Docker image
echo "2. Building Docker image..."
docker build -t invoiceme-backend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi
echo "✅ Docker image built successfully"
echo ""

# Show image info
echo "3. Image information:"
docker images | grep invoiceme-backend
echo ""

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  - Run with docker-compose: docker compose -f docker-compose-full.yml up"
echo "  - Or run standalone: docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod invoiceme-backend:latest"

