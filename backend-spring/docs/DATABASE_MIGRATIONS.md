# Database Migration Strategy

This document outlines the approach for managing database schema changes using Flyway for the ERP backend.

## Why Database Migrations?

As the application evolves, you'll need to:
- Add new tables
- Modify existing columns
- Add indexes for performance
- Seed reference data
- Refactor schema structure

**Without migrations**: Manual SQL scripts, version conflicts, environment inconsistencies

**With migrations**: Versioned, repeatable, trackable schema changes

## Flyway vs Liquibase

| Feature | Flyway | Liquibase |
|---------|--------|-----------|
| Learning Curve | Easier | Steeper |
| SQL Support | Native SQL | XML/YAML/JSON (+ SQL) |
| Rollbacks | Pro only | Free |
| Best For | Simple migrations | Complex enterprise needs |

**Recommendation**: Start with Flyway for simplicity. Flyway's free version covers most needs.

## Implementation Plan

### Step 1: Add Flyway Dependency

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

### Step 2: Configure Flyway

Add to `application.properties`:

```properties
# Flyway Configuration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-version=0
```

Add to `application-prod.properties`:

```properties
# Flyway for production
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.validate-on-migrate=true
```

### Step 3: Disable Hibernate Auto-DDL

**Important**: Once using Flyway, turn off Hibernate's schema generation.

Update `application-prod.properties`:

```properties
# Disable Hibernate DDL (Flyway will manage schema)
spring.jpa.hibernate.ddl-auto=validate
```

This ensures Hibernate only validates schema matches entities, not creates/updates it.

### Step 4: Create Migration Directory Structure

```
backend/src/main/resources/
└── db/
    └── migration/
        ├── V1__initial_schema.sql
        ├── V2__add_customer_phone.sql
        ├── V3__add_invoice_notes.sql
        └── ...
```

### Step 5: Naming Convention

Flyway migrations follow this pattern:

```
V{version}__{description}.sql

Examples:
V1__initial_schema.sql
V2__add_customer_phone.sql
V2.1__add_customer_tax_id.sql
V3__create_products_table.sql
```

Rules:
- **V**: Versioned migration (required)
- **Version**: Numeric, can be major.minor (e.g., 2.1)
- **Double underscore**: Separates version from description
- **Description**: Snake_case or CamelCase, no spaces
- **Extension**: `.sql`

## Migration Examples

### V1__initial_schema.sql

Convert existing Hibernate-generated schema to a Flyway baseline:

```sql
-- Initial Schema for InvoiceMe ERP
-- Generated from existing Hibernate entities

-- Customers Table
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    billing_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_active ON customers(is_active);

-- Invoices Table
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total DECIMAL(19, 2) NOT NULL,
    balance DECIMAL(19, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Line Items Table
CREATE TABLE line_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(19, 2) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_line_items_invoice ON line_items(invoice_id);

-- Payments Table
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

### V2__add_customer_phone.sql

Add a new column:

```sql
-- Add phone number field to customers

ALTER TABLE customers
ADD COLUMN phone VARCHAR(20);

CREATE INDEX idx_customers_phone ON customers(phone);
```

### V3__add_invoice_notes.sql

Add another column:

```sql
-- Add notes field to invoices for additional context

ALTER TABLE invoices
ADD COLUMN notes TEXT;
```

### V4__add_payment_reference.sql

```sql
-- Add reference number for payment tracking

ALTER TABLE payments
ADD COLUMN reference_number VARCHAR(100);

CREATE INDEX idx_payments_reference ON payments(reference_number);
```

### V5__create_products_table.sql

Add a new table:

```sql
-- Create products/services catalog

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_price DECIMAL(19, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_active ON products(is_active);
```

## Best Practices

### 1. Never Modify Existing Migrations

Once a migration is deployed, **never change it**. Always create a new migration.

❌ **Bad**:
```sql
-- Modifying V2__add_customer_phone.sql after deployment
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN fax VARCHAR(20); -- Added later
```

✅ **Good**:
```sql
-- V2__add_customer_phone.sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);

-- V3__add_customer_fax.sql (new migration)
ALTER TABLE customers ADD COLUMN fax VARCHAR(20);
```

### 2. Test Migrations Locally First

```bash
# Test on local PostgreSQL
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Verify in database
docker exec -it invoiceme-db psql -U invoiceme_user -d invoiceme
SELECT * FROM flyway_schema_history;
\dt
\q
```

### 3. Use Transactions

Most DDL statements in PostgreSQL are transactional. Flyway wraps each migration in a transaction by default.

For complex migrations:

```sql
-- V10__complex_migration.sql
BEGIN;

-- Multiple related changes
ALTER TABLE customers ADD COLUMN status VARCHAR(20);
UPDATE customers SET status = 'ACTIVE' WHERE is_active = true;
UPDATE customers SET status = 'INACTIVE' WHERE is_active = false;
ALTER TABLE customers ALTER COLUMN status SET NOT NULL;

COMMIT;
```

### 4. Include Rollback Scripts (Optional)

While Flyway Community doesn't support automatic rollbacks, document them:

```sql
-- V5__create_products_table.sql

-- Migration:
CREATE TABLE products (...);

-- Rollback (manual, if needed):
-- DROP TABLE products;
```

### 5. Data Migrations

For seeding reference data:

```sql
-- V6__seed_payment_methods.sql

INSERT INTO payment_methods (id, name, is_active)
VALUES
  ('pm_001', 'Credit Card', true),
  ('pm_002', 'Bank Transfer', true),
  ('pm_003', 'Cash', true),
  ('pm_004', 'Check', true)
ON CONFLICT (id) DO NOTHING;
```

## Flyway Commands

### Via Spring Boot

```bash
# Run migrations (automatic on startup)
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Clean database (DESTRUCTIVE - dev only)
./mvnw flyway:clean -Dflyway.user=invoiceme_user -Dflyway.password=invoiceme_password -Dflyway.url=jdbc:postgresql://localhost:5432/invoiceme

# Info: View migration status
./mvnw flyway:info -Dflyway.user=invoiceme_user -Dflyway.password=invoiceme_password -Dflyway.url=jdbc:postgresql://localhost:5432/invoiceme

# Validate: Check if applied migrations match available ones
./mvnw flyway:validate -Dflyway.user=invoiceme_user -Dflyway.password=invoiceme_password -Dflyway.url=jdbc:postgresql://localhost:5432/invoiceme
```

### Via Flyway CLI (Advanced)

```bash
# Install Flyway CLI
brew install flyway

# Configure flyway.conf
flyway.url=jdbc:postgresql://localhost:5432/invoiceme
flyway.user=invoiceme_user
flyway.password=invoiceme_password
flyway.locations=filesystem:./src/main/resources/db/migration

# Run migrations
flyway migrate

# View status
flyway info
```

## Migration Workflow

### Development Cycle

1. **Develop feature** requiring schema changes
2. **Create migration** file with next version number
3. **Test locally**: Restart Spring Boot, verify migration applied
4. **Check flyway_schema_history** table
5. **Commit migration** file to git
6. **Deploy**: Migration runs automatically on application startup

### Handling Failed Migrations

If a migration fails:

```bash
# Check flyway_schema_history
SELECT * FROM flyway_schema_history WHERE success = false;

# Manual fix required:
# 1. Fix the issue (data/schema)
# 2. Update flyway_schema_history to mark as successful, OR
# 3. Flyway repair (removes failed migration from history)
./mvnw flyway:repair
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Migrations tested locally
- [ ] Migrations reviewed by team
- [ ] Rollback plan documented
- [ ] Database backup created
- [ ] Maintenance window scheduled (if downtime needed)

### Deployment Process

1. **Backup database**:
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier invoiceme-db \
     --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)
   ```

2. **Deploy new application version** (migrations run on startup)

3. **Verify migrations**:
   ```bash
   # Check logs
   aws logs tail /aws/elasticbeanstalk/invoiceme-prod/var/log/eb-engine.log --follow | grep Flyway

   # Query database
   SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
   ```

4. **Smoke test** application

### Zero-Downtime Migrations

For large tables or long-running migrations:

1. **Backward-compatible changes**: New columns as nullable, add indexes concurrently
2. **Multi-step migrations**: Add column → Deploy code → Populate column → Make required
3. **Blue-Green deployment**: Migrate on green, switch after verification

Example:

```sql
-- V10__add_customer_status_step1.sql
-- Step 1: Add nullable column
ALTER TABLE customers ADD COLUMN status VARCHAR(20);
```

Deploy application with code that handles null status.

```sql
-- V11__add_customer_status_step2.sql
-- Step 2: Populate column
UPDATE customers SET status = CASE
  WHEN is_active = true THEN 'ACTIVE'
  ELSE 'INACTIVE'
END;
```

```sql
-- V12__add_customer_status_step3.sql
-- Step 3: Make column required
ALTER TABLE customers ALTER COLUMN status SET NOT NULL;
```

## Monitoring

### Check Migration History

```sql
SELECT
  version,
  description,
  type,
  script,
  installed_on,
  execution_time,
  success
FROM flyway_schema_history
ORDER BY installed_rank DESC;
```

### CloudWatch Alerts

Set up alerts for migration failures:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flyway-migration-failure \
  --alarm-description "Alert on Flyway migration failure" \
  --metric-name Errors \
  --namespace AWS/Logs \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

## Next Steps (Optional)

Once Flyway is stable:

1. **Automate migration validation** in CI/CD
2. **Add integration tests** that run migrations
3. **Consider Flyway Teams/Pro** for rollback support
4. **Implement database versioning** strategy
5. **Add migration notifications** (Slack, email)

## Alternatives

### Liquibase

If you need more complex change management:

```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

Liquibase uses XML/YAML/JSON for database-agnostic migrations and has better rollback support.

### Plain SQL Scripts

For simple projects, manual SQL scripts may suffice:
- Version in git
- Apply manually to each environment
- Track in custom migrations table

## Summary

**Current State**: Hibernate auto-DDL (`spring.jpa.hibernate.ddl-auto=update`)
- ✅ Quick for development
- ❌ Risky for production
- ❌ No version control
- ❌ No rollback
- ❌ Can cause data loss

**Recommended Next Iteration**: Flyway
- ✅ Versioned migrations
- ✅ Repeatable deployments
- ✅ Automatic on startup
- ✅ Rollback documentation
- ✅ Production-ready

**Implementation Effort**: Low (1-2 days)
**Priority**: Medium (nice-to-have for production readiness)

