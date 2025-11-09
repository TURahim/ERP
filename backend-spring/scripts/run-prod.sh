#!/bin/bash
# Run backend in production mode with PostgreSQL database

echo "Starting ERP Backend in PRODUCTION mode (PostgreSQL)..."
echo "======================================================="
echo ""
echo "Make sure PostgreSQL is running:"
echo "  docker-compose up -d"
echo ""

cd "$(dirname "$0")/.."

# Check if PostgreSQL is accessible
if ! command -v nc &> /dev/null; then
    echo "⚠️  netcat (nc) not found. Skipping PostgreSQL connection check."
else
    if ! nc -z localhost 5432 2>/dev/null; then
        echo "❌ PostgreSQL is not running on localhost:5432"
        echo "   Start it with: docker-compose up -d"
        exit 1
    fi
    echo "✅ PostgreSQL is running"
fi

echo ""
echo "Starting Spring Boot with 'prod' profile..."
echo ""

./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

echo ""
echo "Backend stopped."

