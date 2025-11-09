# Testing Guide

## Smoke Test - Local PostgreSQL

This guide walks through verifying that the backend works with PostgreSQL locally.

### Prerequisites

- Docker installed and running
- Backend code compiled: `./mvnw clean compile`
- Frontend running with real API mode

### Step 1: Start PostgreSQL

```bash
cd /Users/tahmeedrahim/Documents/backend
docker-compose up -d
```

Verify it's running:
```bash
docker ps | grep invoiceme-db
```

You should see the container running on port 5432.

### Step 2: Start Backend with Prod Profile

```bash
# Using script
./scripts/run-prod.sh

# Or directly
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

Watch for these log messages:
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
Hibernate: create table customers ...
Started ErpBackendApplication in X.XXX seconds
```

### Step 3: Verify Backend Health

In a new terminal:

```bash
# Health check
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

### Step 4: Test API Endpoints

```bash
# List customers (should be empty initially)
curl -H "X-API-Key: demo-api-key-12345" \
     http://localhost:8080/api/customers

# Expected: {"data":[],"pagination":{"page":0,"size":10,"total":0,"totalPages":0}}

# Create a customer
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-12345" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "billingAddress": "123 Test St"
  }'

# List customers again (should show the new customer)
curl -H "X-API-Key: demo-api-key-12345" \
     http://localhost:8080/api/customers
```

### Step 5: Seed Demo Data (Frontend)

```bash
cd /Users/tahmeedrahim/Documents/ERP

# Make sure .env.local has:
# NEXT_PUBLIC_USE_MOCK_API=false
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# NEXT_PUBLIC_API_KEY=demo-api-key-12345

# Seed demo data
npm run seed:demo
```

Expected output:
```
🌱 Starting demo data seeding...
API URL: http://localhost:8080

📝 Creating customers...
  ✅ Created customer: Acme Corporation
  ✅ Created customer: TechStart Inc
  ...
✅ Created 8 customers

📄 Creating invoices...
  ...
✅ Created 20 invoices

📤 Sending invoices...
  ...
✅ Sent 10 invoices

💰 Recording payments...
  ...
✅ Recorded 15 payments

🎉 Demo data seeding complete!
```

### Step 6: Verify Data in PostgreSQL

```bash
# Connect to PostgreSQL
docker exec -it invoiceme-db psql -U invoiceme_user -d invoiceme

# Check tables
\dt

# Count customers
SELECT COUNT(*) FROM customers;

# Count invoices
SELECT COUNT(*) FROM invoices;

# View some data
SELECT id, name, email FROM customers LIMIT 5;

# Exit
\q
```

### Step 7: Verify in Frontend

1. Open browser: `http://localhost:3000`
2. Login with any credentials (or use demo login)
3. Navigate to Customers page
4. You should see the seeded customers
5. Navigate to Invoices page
6. You should see the seeded invoices
7. Click "View" on an invoice to see details

### Step 8: Test Persistence

1. **Stop the backend** (Ctrl+C in terminal running backend)
2. **Restart the backend**:
   ```bash
   ./scripts/run-prod.sh
   ```
3. **Verify data persists**:
   ```bash
   curl -H "X-API-Key: demo-api-key-12345" \
        http://localhost:8080/api/customers
   ```
   You should see all the customers that were created before the restart.

4. **Refresh the frontend** - all data should still be there

✅ **Success!** Data persists across backend restarts because it's stored in PostgreSQL.

## Troubleshooting

### Backend won't start

**Error**: `Connection to localhost:5432 refused`
- **Solution**: Start PostgreSQL: `docker-compose up -d`

**Error**: `Port 8080 already in use`
- **Solution**: Stop other backend instance: `lsof -i :8080` and kill the process

**Error**: `Caused by: org.postgresql.util.PSQLException: FATAL: password authentication failed`
- **Solution**: Check PostgreSQL credentials in `application-prod.properties` match docker-compose.yml

### Frontend shows no data

1. Check `.env.local`:
   ```
   NEXT_PUBLIC_USE_MOCK_API=false
   ```
2. Restart frontend: `npm run dev`
3. Check browser console for errors
4. Check Network tab - requests should go to `/api/backend/*`

### Seed script fails

**Error**: `Failed to create customer: Network Error`
- **Solution**: Backend not running or wrong URL in `.env.local`

**Error**: `DUPLICATE_EMAIL`
- **Solution**: Data already seeded. Drop tables and try again:
  ```sql
  docker exec -it invoiceme-db psql -U invoiceme_user -d invoiceme
  DROP TABLE payments CASCADE;
  DROP TABLE line_items CASCADE;
  DROP TABLE invoices CASCADE;
  DROP TABLE customers CASCADE;
  \q
  ```
  Restart backend to recreate tables.

## Clean Slate

To start fresh with empty database:

```bash
# Stop backend (Ctrl+C)

# Remove all data
docker-compose down -v

# Start fresh
docker-compose up -d

# Restart backend
./scripts/run-prod.sh
```

## Performance Testing

### Load Test with Apache Bench

```bash
# Test customer list endpoint
ab -n 1000 -c 10 \
   -H "X-API-Key: demo-api-key-12345" \
   http://localhost:8080/api/customers

# Test invoice list endpoint
ab -n 1000 -c 10 \
   -H "X-API-Key: demo-api-key-12345" \
   http://localhost:8080/api/invoices
```

## Monitoring

### Watch Backend Logs

```bash
# Follow backend logs
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod | tee backend.log
```

### Watch PostgreSQL Logs

```bash
docker logs -f invoiceme-db
```

### Monitor Queries

Enable SQL logging in `application-prod.properties`:
```properties
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
```

