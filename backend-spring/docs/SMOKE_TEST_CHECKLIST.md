# Smoke Test Checklist

## Prerequisites

- [ ] Docker installed (for PostgreSQL): https://www.docker.com/get-started
- [ ] Backend compiled: `cd /Users/tahmeedrahim/Documents/backend && ./mvnw clean compile`
- [ ] Frontend configured for real API: `.env.local` has `NEXT_PUBLIC_USE_MOCK_API=false`

## Step 1: Start PostgreSQL

```bash
cd /Users/tahmeedrahim/Documents/backend
docker compose up -d
```

Verify:
```bash
docker ps | grep invoiceme-db
```

## Step 2: Start Backend with Prod Profile

```bash
./scripts/run-prod.sh
```

Or:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

Wait for: "Started ErpBackendApplication"

## Step 3: Verify Health

```bash
curl http://localhost:8080/actuator/health
```

Expected: `{"status":"UP"}`

## Step 4: Seed Demo Data

```bash
cd /Users/tahmeedrahim/Documents/ERP
npm run seed:demo
```

Expected: "🎉 Demo data seeding complete!"

## Step 5: Verify in Frontend

1. Open http://localhost:3000
2. Navigate to Customers page
3. Verify customers are displayed
4. Navigate to Invoices page
5. Verify invoices are displayed

## Step 6: Test Persistence

1. Stop backend (Ctrl+C)
2. Restart: `./scripts/run-prod.sh`
3. Refresh frontend
4. Verify data persists

✅ **Success!** PostgreSQL setup is working correctly.

## Troubleshooting

### Docker not installed
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart terminal after installation

### Port 5432 in use
```bash
lsof -i :5432
kill -9 <PID>
```

### Backend connection errors
- Check PostgreSQL is running: `docker ps`
- Check credentials in `application-prod.properties`
- View logs: `docker logs invoiceme-db`

