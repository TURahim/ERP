# ERP Backend

Spring Boot backend API for InvoiceMe ERP system.

## Prerequisites

- Java 17 or higher
- Maven 3.6+ (or use Maven wrapper)

## Quick Start

### Development Mode (H2 Database)

For local development with in-memory H2 database:

```bash
# Using script (recommended)
./scripts/run-dev.sh

# Or using Maven Wrapper directly
./mvnw spring-boot:run
```

### Production Mode (PostgreSQL Database)

For production-like setup with persistent PostgreSQL:

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Run backend**:
   ```bash
   # Using script (recommended)
   ./scripts/run-prod.sh

   # Or using Maven Wrapper directly
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
   ```

The backend will start on `http://localhost:8080`

See [PostgreSQL Setup Guide](docs/POSTGRES_SETUP.md) for detailed database configuration.

## API Endpoints

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/{id}` - Get customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `PUT /api/customers/{id}/deactivate` - Deactivate customer

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/{id}` - Get invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/{id}` - Update invoice
- `POST /api/invoices/{id}/send` - Send invoice
- `GET /api/invoices/{id}/payments` - Get invoice payments

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments/{id}` - Get payment

## Authentication

All API requests require the `X-API-Key` header:
```
X-API-Key: demo-api-key-12345
```

## Database

- **Development**: H2 in-memory database (default)
- **Production**: PostgreSQL (configure in `application-prod.properties`)

## Configuration

### Profiles

The backend supports two profiles:

- **dev** (default): Uses H2 in-memory database
  - Configuration: `src/main/resources/application.properties`
  - Data persists only while backend is running

- **prod**: Uses PostgreSQL database
  - Configuration: `src/main/resources/application-prod.properties`
  - Data persists across restarts
  - Requires PostgreSQL running (see `docker-compose.yml`)

### Environment Variables

For production deployments, use environment variables instead of hardcoded values:

```bash
# Database
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/invoiceme
export SPRING_DATASOURCE_USERNAME=invoiceme_user
export SPRING_DATASOURCE_PASSWORD=your_secure_password

# API Key
export API_KEY=your_production_api_key

# Profile
export SPRING_PROFILES_ACTIVE=prod
```

See `.env.example` for a complete list of environment variables.

## Testing

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

### Test API
```bash
curl -H "X-API-Key: demo-api-key-12345" \
     http://localhost:8080/api/customers
```

## Building

```bash
./mvnw clean package
java -jar target/erp-backend-0.0.1-SNAPSHOT.jar
```

