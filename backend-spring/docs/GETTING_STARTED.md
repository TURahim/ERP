# Getting Started - Local PostgreSQL Testing

This guide walks you through testing your ERP backend with PostgreSQL locally before deploying to AWS.

## Prerequisites Checklist

- [x] AWS CLI installed
- [ ] AWS CLI configured (`aws configure`)
- [ ] Docker installed and running
- [ ] Backend code compiled (`./mvnw clean compile`)
- [ ] Frontend dependencies installed (`npm install`)

## Step-by-Step Local Testing

### Step 1: Start PostgreSQL

```bash
cd /Users/tahmeedrahim/Documents/backend

# Start PostgreSQL with Docker
docker compose up -d

# Verify it's running
docker ps | grep invoiceme-db
```

Expected output:
```
CONTAINER ID   IMAGE         STATUS         PORTS
xxxxxxxxxxxxx  postgres:16   Up 10 seconds  0.0.0.0:5432->5432/tcp
```

### Step 2: Start Backend with PostgreSQL

```bash
# Still in /Users/tahmeedrahim/Documents/backend
./scripts/run-prod.sh
```

Watch for these success messages:
```
✅ PostgreSQL is running
Starting Spring Boot with 'prod' profile...
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
Hibernate: create table customers ...
Started ErpBackendApplication in X.XXX seconds
```

**Leave this terminal running** - it's your backend server.

### Step 3: Test Backend API

Open a **new terminal** and run:

```bash
# Health check
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}

# Test API with authentication
curl -H "X-API-Key: demo-api-key-12345" \
     http://localhost:8080/api/customers

# Expected: {"data":[],"pagination":{...}}
```

✅ If both work, your backend is running correctly!

### Step 4: Configure Frontend

```bash
cd /Users/tahmeedrahim/Documents/ERP

# Check .env.local file
cat .env.local
```

Make sure it contains:
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=demo-api-key-12345
```

### Step 5: Start Frontend

```bash
# Still in /Users/tahmeedrahim/Documents/ERP
npm run dev
```

Expected output:
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
```

### Step 6: Seed Demo Data

Open a **new terminal** (keep frontend running):

```bash
cd /Users/tahmeedrahim/Documents/ERP

npm run seed:demo
```

Expected output:
```
🌱 Starting demo data seeding...
✅ Created 8 customers
✅ Created 20 invoices
✅ Sent 10 invoices
✅ Recorded 15 payments
🎉 Demo data seeding complete!
```

### Step 7: Test in Browser

1. Open http://localhost:3000
2. Click **"View Demo"** → Should show demo data (mock API)
3. Click **"Logout"**
4. Click **"Sign Up"** → Create a new account
5. Navigate to **Customers** page → Should see seeded customers
6. Navigate to **Invoices** page → Should see seeded invoices
7. Click **"Export CSV"** → Should download CSV file
8. Check **Dashboard** → Should show real metrics

✅ Everything working? Great! Your local setup is complete.

### Step 8: Test Data Persistence

This is the key test to verify PostgreSQL is working:

1. **Stop the backend** (Ctrl+C in backend terminal)
2. **Restart the backend**:
   ```bash
   ./scripts/run-prod.sh
   ```
3. **Refresh frontend** in browser
4. **Verify data is still there** (customers, invoices)

✅ **Success!** Data persists because it's in PostgreSQL, not in-memory.

## Troubleshooting

### Docker Not Found

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/get-started
# After installation, restart terminal and try again
```

### Port 5432 Already in Use

```bash
# Check what's using port 5432
lsof -i :5432

# If it's PostgreSQL installed locally, either:
# 1. Stop it: brew services stop postgresql
# 2. Use different port in docker-compose.yml
```

### Backend Won't Start

**Error**: `Connection to localhost:5432 refused`

```bash
# PostgreSQL not running
docker compose up -d
```

**Error**: `Port 8080 already in use`

```bash
# Another backend instance is running
lsof -i :8080
kill -9 <PID>
```

### Frontend Shows No Data

```bash
# 1. Check backend is running
curl http://localhost:8080/actuator/health

# 2. Check .env.local
cat .env.local | grep NEXT_PUBLIC_USE_MOCK_API

# Should be: NEXT_PUBLIC_USE_MOCK_API=false

# 3. Restart frontend
# Ctrl+C in frontend terminal, then:
npm run dev
```

### Seed Script Fails

**Error**: `Failed to create customer`

```bash
# Backend not running or wrong URL
# Check backend is accessible:
curl http://localhost:8080/actuator/health
```

**Error**: `DUPLICATE_EMAIL` or `DUPLICATE_KEY`

```bash
# Data already seeded. To start fresh:

# 1. Stop backend (Ctrl+C)

# 2. Reset database
docker compose down -v
docker compose up -d

# 3. Restart backend
./scripts/run-prod.sh

# 4. Seed again
cd /Users/tahmeedrahim/Documents/ERP
npm run seed:demo
```

## Clean Slate

To completely reset your local environment:

```bash
# Stop everything
# Ctrl+C in all terminals (backend, frontend)

# Remove PostgreSQL data
cd /Users/tahmeedrahim/Documents/backend
docker compose down -v

# Start fresh
docker compose up -d
./scripts/run-prod.sh

# In new terminal:
cd /Users/tahmeedrahim/Documents/ERP
npm run seed:demo
npm run dev
```

## Next: AWS Deployment

Once local testing is complete, you're ready to deploy to AWS!

See: **`docs/AWS_DEPLOYMENT.md`** for the full deployment guide.

### Quick AWS Deployment Overview

1. **Create RDS PostgreSQL** (~10 minutes)
   - Database in the cloud
   - Persistent, managed, backed up

2. **Deploy Backend to Elastic Beanstalk** (~15 minutes)
   - Uploads your JAR/Docker image
   - Automatically provisions servers
   - Connects to RDS

3. **Deploy Frontend to Vercel** (~5 minutes)
   - Push to GitHub
   - Vercel auto-deploys
   - Configure environment variables

4. **Verify Production** (~10 minutes)
   - Run smoke tests
   - Check health endpoints
   - Test CRUD operations

**Total time**: ~40-60 minutes for first deployment

## Summary

✅ **Completed**:
- [x] AWS CLI installed and configured
- [ ] Docker installed
- [ ] PostgreSQL running locally
- [ ] Backend running with PostgreSQL
- [ ] Frontend connected to backend
- [ ] Demo data seeded
- [ ] Data persistence verified

✅ **Next**: Deploy to AWS (when ready)

## Quick Commands Reference

```bash
# Start local PostgreSQL
docker compose up -d

# Start backend (PostgreSQL mode)
./scripts/run-prod.sh

# Start frontend
npm run dev

# Seed data
npm run seed:demo

# Health check
curl http://localhost:8080/actuator/health

# Stop PostgreSQL
docker compose down

# Reset PostgreSQL data
docker compose down -v
```

