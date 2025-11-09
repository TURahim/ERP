# PostgreSQL Setup Guide

This guide covers setting up PostgreSQL for the ERP backend, both locally and for production.

## Local Development with Docker

### Quick Start

1. **Start PostgreSQL** (using docker-compose):
   ```bash
   cd /Users/tahmeedrahim/Documents/backend
   docker-compose up -d
   ```

2. **Verify PostgreSQL is running**:
   ```bash
   docker ps | grep invoiceme-db
   ```

3. **Check PostgreSQL logs**:
   ```bash
   docker logs invoiceme-db
   ```

### Alternative: Docker Run Command

If you prefer not to use docker-compose:

```bash
docker run --name invoiceme-db \
  -e POSTGRES_DB=invoiceme \
  -e POSTGRES_USER=invoiceme_user \
  -e POSTGRES_PASSWORD=invoiceme_password \
  -p 5432:5432 \
  -v invoiceme_data:/var/lib/postgresql/data \
  -d postgres:16
```

## Database Connection Details

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | invoiceme |
| Username | invoiceme_user |
| Password | invoiceme_password |
| JDBC URL | jdbc:postgresql://localhost:5432/invoiceme |

## Connecting to PostgreSQL

### Using psql (PostgreSQL CLI)

```bash
# Access PostgreSQL shell
docker exec -it invoiceme-db psql -U invoiceme_user -d invoiceme

# Or if you have psql installed locally
psql -h localhost -p 5432 -U invoiceme_user -d invoiceme
```

### Common psql Commands

```sql
-- List all tables
\dt

-- Describe a table
\d customers

-- View table data
SELECT * FROM customers;

-- Exit psql
\q
```

### Using pgAdmin or DBeaver

You can also connect using GUI tools:
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/

Connection settings:
- Host: `localhost`
- Port: `5432`
- Database: `invoiceme`
- Username: `invoiceme_user`
- Password: `invoiceme_password`

## Managing the Database

### Stop PostgreSQL

```bash
docker-compose down
```

### Stop and remove data (clean slate)

```bash
docker-compose down -v
```

### Restart PostgreSQL

```bash
docker-compose restart
```

### View PostgreSQL logs

```bash
docker-compose logs -f postgres
```

## Backup and Restore

### Backup Database

```bash
docker exec invoiceme-db pg_dump -U invoiceme_user invoiceme > backup.sql
```

### Restore Database

```bash
docker exec -i invoiceme-db psql -U invoiceme_user invoiceme < backup.sql
```

## Production Setup

For production, use a managed PostgreSQL service:

### AWS RDS PostgreSQL
1. Create RDS PostgreSQL instance (16.x recommended)
2. Note the endpoint, port, database name
3. Create user and password via RDS console or CLI
4. Configure security group to allow backend access
5. Update `application-prod.properties` with connection details

### Azure Database for PostgreSQL
1. Create Azure Database for PostgreSQL server
2. Note the server name, admin username
3. Configure firewall rules
4. Update connection string in backend config

## Troubleshooting

### Port 5432 already in use

Check if PostgreSQL is already running:
```bash
lsof -i :5432
```

Kill the process or use a different port in docker-compose.yml.

### Connection refused

1. Verify PostgreSQL is running: `docker ps`
2. Check logs: `docker logs invoiceme-db`
3. Verify network: `docker network ls`
4. Try restarting: `docker-compose restart`

### Permission denied

1. Stop PostgreSQL: `docker-compose down -v`
2. Remove volumes: `docker volume rm backend_postgres_data`
3. Start fresh: `docker-compose up -d`

## Security Best Practices

### Development
- Use strong passwords even for local dev
- Don't commit passwords to git
- Use `.env` files for credentials

### Production
- Use AWS Secrets Manager or Azure Key Vault
- Enable SSL/TLS connections
- Use IAM authentication where possible
- Regular backups and point-in-time recovery
- Monitor and audit access logs

