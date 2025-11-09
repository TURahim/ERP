#!/bin/bash
# Run backend in development mode with H2 database

echo "Starting ERP Backend in DEVELOPMENT mode (H2 database)..."
echo "================================================"
echo ""

cd "$(dirname "$0")/.."

./mvnw spring-boot:run

echo ""
echo "Backend stopped."

