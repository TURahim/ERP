# Backend Setup Guide

This guide will help you set up the backend API for the ERP frontend application.

## Prerequisites

- Java 17 or higher
- Maven 3.6+ (or use Maven wrapper)
- PostgreSQL (or H2 for development)
- Git

## Option 1: Clone Existing Backend Repository

If you have a backend repository on GitHub:

```bash
cd /Users/tahmeedrahim/Documents
git clone https://github.com/TURahim/ERP-Backend.git backend
# Or your backend repository URL
cd backend
```

## Option 2: Create New Spring Boot Backend

If you need to create a new backend from scratch:

### 1. Generate Spring Boot Project

Use Spring Initializr (https://start.spring.io/) with these settings:
- **Project**: Maven
- **Language**: Java
- **Spring Boot**: 3.2.x or higher
- **Packaging**: Jar
- **Java**: 17 or higher
- **Dependencies**: 
  - Spring Web
  - Spring Data JPA
  - PostgreSQL Driver (or H2 Database for development)
  - Validation
  - Lombok (optional but recommended)

### 2. Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/invoiceme/
│   │   │   ├── ERPApplication.java
│   │   │   ├── controller/
│   │   │   │   ├── CustomerController.java
│   │   │   │   ├── InvoiceController.java
│   │   │   │   └── PaymentController.java
│   │   │   ├── service/
│   │   │   │   ├── CustomerService.java
│   │   │   │   ├── InvoiceService.java
│   │   │   │   └── PaymentService.java
│   │   │   ├── repository/
│   │   │   │   ├── CustomerRepository.java
│   │   │   │   ├── InvoiceRepository.java
│   │   │   │   └── PaymentRepository.java
│   │   │   ├── model/
│   │   │   │   ├── Customer.java
│   │   │   │   ├── Invoice.java
│   │   │   │   └── Payment.java
│   │   │   └── config/
│   │   │       └── ApiKeyFilter.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── application-dev.properties
│   └── test/
└── pom.xml
```

## Backend API Requirements

The backend must implement the following endpoints:

### Customers API

- `GET /api/customers` - List customers (with pagination)
  - Query params: `page`, `size`, `includeInactive` (optional)
  - Response: `{ data: Customer[], pagination: { page, size, total, totalPages } }`

- `GET /api/customers/{id}` - Get customer by ID
  - Response: `Customer`

- `POST /api/customers` - Create customer
  - Body: `{ name: string, email: string, billingAddress: string }`
  - Response: `Customer`

- `PUT /api/customers/{id}` - Update customer
  - Body: `{ name?: string, email?: string, billingAddress?: string }`
  - Response: `Customer`

- `PUT /api/customers/{id}/deactivate` - Deactivate customer
  - Response: `Customer`

### Invoices API

- `GET /api/invoices` - List invoices (with pagination)
  - Query params: `page`, `size`, `status` (optional), `customerId` (optional)
  - Response: `{ data: Invoice[], pagination: { page, size, total, totalPages } }`

- `GET /api/invoices/{id}` - Get invoice by ID
  - Response: `Invoice`

- `POST /api/invoices` - Create invoice
  - Body: `{ customerId: string, lineItems: LineItem[], dueDate: string, discount?: number }`
  - Response: `Invoice`

- `PUT /api/invoices/{id}` - Update invoice (only if DRAFT)
  - Body: `{ lineItems?: LineItem[], dueDate?: string }`
  - Response: `Invoice`

- `POST /api/invoices/{id}/send` - Send invoice (change status to SENT)
  - Response: `Invoice`

- `GET /api/invoices/{id}/payments` - Get payments for invoice
  - Response: `Payment[]`

### Payments API

- `POST /api/payments` - Record payment
  - Body: `{ invoiceId: string, amount: number, paymentMethod: string, notes?: string }`
  - Response: `Payment`

- `GET /api/payments/{id}` - Get payment by ID
  - Response: `Payment`

## API Authentication

The backend should validate API keys via the `X-API-Key` header:

```java
@Configuration
public class ApiKeyFilter implements Filter {
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String VALID_API_KEY = "demo-api-key-12345"; // Or from env
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String apiKey = httpRequest.getHeader(API_KEY_HEADER);
        
        if (!VALID_API_KEY.equals(apiKey)) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Invalid API Key\"}}");
            return;
        }
        
        chain.doFilter(request, response);
    }
}
```

## Error Response Format

All errors should follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common error codes:
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already exists
- `UNPAID_INVOICES` - Cannot deactivate customer with unpaid invoices
- `INVALID_STATUS` - Invalid operation for current status
- `OVERPAYMENT` - Payment amount exceeds balance
- `UNAUTHORIZED` - Invalid API key

## Data Models

### Customer
```typescript
{
  id: string
  name: string
  email: string
  billingAddress: string
  isActive: boolean
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

### Invoice
```typescript
{
  id: string
  customerId: string
  invoiceNumber: string
  status: "DRAFT" | "SENT" | "PAID"
  total: number
  balance: number
  dueDate: string (YYYY-MM-DD)
  lineItems: LineItem[]
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}

LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}
```

### Payment
```typescript
{
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  createdAt: string (ISO 8601)
}
```

## Configuration

### application.properties

```properties
# Server Configuration
server.port=8080
spring.application.name=invoice-me-backend

# Database Configuration (PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5432/invoiceme
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# API Key (should be in environment variable)
api.key=demo-api-key-12345

# CORS Configuration
spring.web.cors.allowed-origins=http://localhost:3000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

### For Development (H2 Database)

```properties
# H2 Database (in-memory for development)
spring.datasource.url=jdbc:h2:mem:invoiceme
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
```

## Running the Backend

### Using Maven

```bash
cd backend
mvn spring-boot:run
```

### Using Maven Wrapper

```bash
cd backend
./mvnw spring-boot:run  # Linux/Mac
.\mvnw.cmd spring-boot:run  # Windows
```

### Using Java directly

```bash
cd backend
mvn clean package
java -jar target/invoice-me-backend-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080`

## Testing the Backend

### Health Check

```bash
curl http://localhost:8080/actuator/health
```

### Test API Key

```bash
curl -H "X-API-Key: demo-api-key-12345" http://localhost:8080/api/customers
```

### Create a Customer

```bash
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-12345" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "billingAddress": "123 Test St"
  }'
```

## Connecting Frontend to Backend

1. **Start the backend server** (see above)

2. **Update `.env.local`** in the frontend:
   ```env
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   NEXT_PUBLIC_API_KEY=demo-api-key-12345
   ```

3. **Restart the frontend dev server**:
   ```bash
   npm run dev
   ```

4. **Seed demo data** (optional):
   ```bash
   npm run seed:demo
   ```

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check Maven: `mvn -version`
- Check port 8080 is available: `lsof -i :8080`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8080/actuator/health`
- Check CORS configuration in backend
- Verify API key matches in both frontend `.env.local` and backend config

### API Key errors
- Ensure `X-API-Key` header is being sent (check Network tab in browser)
- Verify API key matches: `demo-api-key-12345` by default

## Next Steps

Once the backend is running:
1. Test all CRUD operations from the frontend
2. Verify invoice lifecycle (DRAFT → SENT → PAID)
3. Test payment recording and balance updates
4. Check error handling for invalid operations


