# Quick Start Guide - InvoiceMe ERP

## Prerequisites

- Node.js 18+ (for frontend)
- Java 17+ (for backend)
- Maven 3.8+ (for backend)
- PostgreSQL 16+ (or Docker)

## Quick Setup

### 1. Start PostgreSQL Database

**Using Docker (Recommended):**
```bash
docker run --name invoiceme-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=invoiceme_db \
  -p 5432:5432 \
  -d postgres:16
```

**Or use existing PostgreSQL:**
- Create database: `CREATE DATABASE invoiceme_db;`

### 2. Start Backend Server

```bash
# Navigate to backend directory
cd ../backend

# Install Maven if needed (macOS)
# brew install maven

# Run backend
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

### 3. Seed Demo Data

In a new terminal (from ERP directory):
```bash
cd ERP
npm run seed:demo
```

This creates:
- 8 customers
- ~20 invoices (mix of DRAFT, SENT, PAID)
- Multiple payments

### 4. Start Frontend

```bash
# Make sure you're in the ERP directory
npm run dev
```

Frontend will start on `http://localhost:3000`

### 5. Configure Frontend to Use Backend

Create `.env.local` in the ERP directory:
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=demo-api-key-12345
```

Restart the frontend dev server.

## Demo Credentials

- Email: `test@example.com`
- Password: `password123` (any password works with mock auth)

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Check Java version: `java -version` (should be 17+)
- Check Maven: `mvn -version`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8080/actuator/health`
- Check `.env.local` has `NEXT_PUBLIC_USE_MOCK_API=false`
- Restart frontend dev server

### Seed script fails
- Make sure backend is running first
- Check API URL matches backend port
- Check database migrations ran successfully

## Project Structure

```
ERP_project/
├── backend/          # Spring Boot backend
│   ├── src/
│   └── pom.xml
├── ERP/              # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
└── docs/             # Documentation
```

## Next Steps

- Explore the application at `http://localhost:3000`
- View API docs at `http://localhost:8080/swagger-ui.html`
- Check out the demo data you seeded!

