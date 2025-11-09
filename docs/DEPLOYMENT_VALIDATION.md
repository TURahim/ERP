# Deployment Validation Checklist

This comprehensive checklist ensures your ERP system is correctly deployed and functioning in production.

## Pre-Deployment Checklist

### Backend (AWS/Production)

- [ ] RDS PostgreSQL instance created and accessible
- [ ] Database credentials stored securely (SSM Parameter Store / Secrets Manager)
- [ ] Backend JAR/Docker image built successfully
- [ ] Elastic Beanstalk environment created
- [ ] Security groups configured (EB ↔ RDS communication)
- [ ] Environment variables set in EB
- [ ] HTTPS/SSL certificate configured (ACM)
- [ ] CloudWatch logging enabled
- [ ] Auto-scaling configured (if applicable)
- [ ] Backup retention configured on RDS

### Frontend (Vercel/AWS)

- [ ] Production build succeeds locally
- [ ] Environment variables configured in deployment platform
- [ ] Backend API URL points to production endpoint
- [ ] Production API key configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics configured (if applicable)

## Post-Deployment Validation

### 1. Backend Health Checks

#### Basic Health Check

```bash
# Replace with your backend URL
BACKEND_URL="https://your-backend-url.elasticbeanstalk.com"

# Health check
curl -f $BACKEND_URL/actuator/health

# Expected: {"status":"UP"}
```

✅ **Pass criteria**: Returns `200 OK` with `{"status":"UP"}`

#### API Authentication

```bash
# Replace with your production API key
API_KEY="your-production-api-key"

# Test authenticated endpoint
curl -H "X-API-Key: $API_KEY" $BACKEND_URL/api/customers

# Expected: {"data":[],"pagination":{...}} or list of customers
```

✅ **Pass criteria**: Returns `200 OK` with JSON response

#### Invalid API Key (Security Test)

```bash
# Test with invalid key
curl -H "X-API-Key: invalid-key" $BACKEND_URL/api/customers

# Expected: {"error":{"code":"UNAUTHORIZED","message":"Invalid API Key"}}
```

✅ **Pass criteria**: Returns `401 Unauthorized` with error message

### 2. Database Connectivity

#### Create Test Customer

```bash
curl -X POST $BACKEND_URL/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "billingAddress": "123 Test Street"
  }'

# Expected: {"data":{"id":"...","name":"Test Customer",...}}
```

✅ **Pass criteria**: Returns `200 OK` with customer object including generated ID

#### Verify Customer Persists

```bash
# List customers
curl -H "X-API-Key: $API_KEY" $BACKEND_URL/api/customers

# Expected: List including "Test Customer"
```

✅ **Pass criteria**: Previously created customer appears in list

#### Test Data Persistence After Restart

1. Restart backend application (EB: Restart App Server)
2. Re-run customer list query
3. Verify data still exists

✅ **Pass criteria**: Data persists across application restarts

### 3. CRUD Operations Testing

#### Customers

```bash
# CREATE
CUSTOMER_ID=$(curl -X POST $BACKEND_URL/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"name":"CRUD Test","email":"crud@test.com"}' \
  | jq -r '.data.id')

# READ
curl -H "X-API-Key: $API_KEY" \
  $BACKEND_URL/api/customers/$CUSTOMER_ID

# UPDATE
curl -X PUT $BACKEND_URL/api/customers/$CUSTOMER_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"name":"CRUD Test Updated","email":"crud@test.com"}'

# DELETE (if implemented)
curl -X DELETE $BACKEND_URL/api/customers/$CUSTOMER_ID \
  -H "X-API-Key: $API_KEY"
```

✅ **Pass criteria**: All operations return appropriate status codes and data

#### Invoices

```bash
# CREATE Invoice
INVOICE_ID=$(curl -X POST $BACKEND_URL/api/invoices \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "customerId":"'$CUSTOMER_ID'",
    "issueDate":"2025-11-09",
    "dueDate":"2025-12-09",
    "lineItems":[
      {"description":"Service","quantity":1,"unitPrice":100.00}
    ]
  }' | jq -r '.data.id')

# READ Invoice
curl -H "X-API-Key: $API_KEY" \
  $BACKEND_URL/api/invoices/$INVOICE_ID

# SEND Invoice
curl -X POST $BACKEND_URL/api/invoices/$INVOICE_ID/send \
  -H "X-API-Key: $API_KEY"
```

✅ **Pass criteria**: Invoice created, readable, and can be sent

#### Payments

```bash
# Record Payment
curl -X POST $BACKEND_URL/api/invoices/$INVOICE_ID/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "amount":50.00,
    "paymentDate":"2025-11-09",
    "paymentMethod":"CREDIT_CARD"
  }'

# Verify invoice balance updated
curl -H "X-API-Key: $API_KEY" \
  $BACKEND_URL/api/invoices/$INVOICE_ID

# Expected: balance should be 50.00 (100 - 50)
```

✅ **Pass criteria**: Payment recorded, invoice balance updated correctly

### 4. Frontend Validation

#### Access Frontend

```bash
# Replace with your frontend URL
FRONTEND_URL="https://your-app.vercel.app"

# Basic connectivity
curl -I $FRONTEND_URL

# Expected: 200 OK, Content-Type: text/html
```

✅ **Pass criteria**: Homepage loads successfully

#### Manual Testing Checklist

Open frontend in browser:

**Authentication**
- [ ] Homepage loads
- [ ] "View Demo" button works → logs in as demo user
- [ ] Demo mode badge appears
- [ ] Demo data appears on dashboard
- [ ] Logout works
- [ ] Login form appears after logout
- [ ] Sign up form accessible

**Dashboard**
- [ ] Dashboard loads after login
- [ ] Metrics display correctly (Total Customers, Total Invoices, Outstanding Balance)
- [ ] Real data appears for non-demo users
- [ ] Demo data appears for demo user

**Customers Page**
- [ ] Customers list loads
- [ ] Search/filter works
- [ ] "Create Customer" button accessible
- [ ] Create customer form works
- [ ] Customer created successfully
- [ ] New customer appears in list
- [ ] "Export CSV" button works
- [ ] CSV downloads with correct data
- [ ] View customer details works
- [ ] Edit customer works

**Invoices Page**
- [ ] Invoices list loads
- [ ] Filters work (status, customer)
- [ ] "Create Invoice" button accessible
- [ ] Create invoice form works
- [ ] Line items can be added/removed
- [ ] Invoice total calculated correctly
- [ ] Invoice created successfully
- [ ] New invoice appears in list
- [ ] "Export CSV" button works
- [ ] CSV downloads with correct data
- [ ] View invoice details works
- [ ] Send invoice works
- [ ] Record payment works
- [ ] Invoice status updates correctly

**Error Handling**
- [ ] Invalid form submissions show errors
- [ ] Network errors show user-friendly messages
- [ ] API errors display correctly
- [ ] Loading states work

### 5. Performance Testing

#### Backend Load Test

Using Apache Bench:

```bash
# Test customer list endpoint (100 concurrent requests, 1000 total)
ab -n 1000 -c 100 \
  -H "X-API-Key: $API_KEY" \
  $BACKEND_URL/api/customers

# Acceptable metrics:
# - Requests per second: > 100
# - Time per request: < 1000ms
# - Failed requests: 0
```

✅ **Pass criteria**: 
- 95th percentile response time < 1000ms
- Zero failed requests
- No 5xx errors

#### Frontend Load Test

```bash
# Test homepage (100 concurrent requests, 1000 total)
ab -n 1000 -c 100 $FRONTEND_URL/

# Acceptable metrics:
# - Requests per second: > 200
# - Time per request: < 500ms
# - Failed requests: 0
```

✅ **Pass criteria**:
- 95th percentile response time < 500ms
- Zero failed requests

### 6. Security Testing

#### HTTPS Enforcement

```bash
# Try HTTP (should redirect to HTTPS)
curl -I http://your-backend-url.com

# Expected: 301 Redirect to https://
```

✅ **Pass criteria**: HTTP requests redirect to HTTPS

#### CORS Configuration

```bash
# Test CORS from different origin
curl -H "Origin: https://malicious.com" \
  -H "X-API-Key: $API_KEY" \
  $BACKEND_URL/api/customers

# Expected: CORS headers should restrict to allowed origins
```

✅ **Pass criteria**: CORS properly configured for frontend domain only

#### SQL Injection Test

```bash
# Attempt SQL injection in customer name
curl -X POST $BACKEND_URL/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"name":"Robert\"); DROP TABLE customers;--","email":"test@test.com"}'

# Expected: Input sanitized, no SQL execution
```

✅ **Pass criteria**: Request handled safely, no SQL injection

### 7. Monitoring and Logging

#### CloudWatch Logs (AWS)

```bash
# View recent logs
aws logs tail /aws/elasticbeanstalk/invoiceme-prod/var/log/eb-engine.log --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/invoiceme-prod/var/log/eb-engine.log \
  --filter-pattern "ERROR"
```

✅ **Pass criteria**: 
- Logs are being generated
- No critical errors
- Application startup logs present

#### RDS Monitoring

```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=invoiceme-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

✅ **Pass criteria**:
- CPU utilization < 80%
- Database connections < max_connections
- No failed connection attempts

### 8. Backup and Recovery

#### Verify RDS Backups

```bash
# List recent snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier invoiceme-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

✅ **Pass criteria**: 
- Automated backups are running
- Snapshots are recent (within 24 hours)
- Backup retention period configured

#### Test Recovery (Optional)

1. Create manual snapshot
2. Restore to new instance
3. Verify data integrity
4. Delete test instance

### 9. Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

✅ **Pass criteria**: Costs within expected budget

### 10. Documentation Review

- [ ] README.md updated with deployment URLs
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide available
- [ ] Monitoring setup documented

## Smoke Test Script

Create `scripts/smoke-test-prod.sh`:

```bash
#!/bin/bash
# Production Smoke Test

set -e

BACKEND_URL="${BACKEND_URL:-https://your-backend-url.com}"
API_KEY="${API_KEY:-your-production-api-key}"
FRONTEND_URL="${FRONTEND_URL:-https://your-frontend-url.com}"

echo "🧪 Running Production Smoke Tests"
echo "=================================="
echo ""

# Backend Health
echo "1. Backend Health Check..."
HEALTH=$(curl -sf $BACKEND_URL/actuator/health || echo "FAIL")
if [[ $HEALTH == *"UP"* ]]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed"
  exit 1
fi

# API Authentication
echo "2. API Authentication..."
CUSTOMERS=$(curl -sf -H "X-API-Key: $API_KEY" $BACKEND_URL/api/customers || echo "FAIL")
if [[ $CUSTOMERS == *"data"* ]]; then
  echo "✅ API authentication works"
else
  echo "❌ API authentication failed"
  exit 1
fi

# Frontend Accessibility
echo "3. Frontend Accessibility..."
FRONTEND=$(curl -sf -I $FRONTEND_URL | head -n 1 || echo "FAIL")
if [[ $FRONTEND == *"200"* ]]; then
  echo "✅ Frontend is accessible"
else
  echo "❌ Frontend accessibility failed"
  exit 1
fi

echo ""
echo "🎉 All smoke tests passed!"
```

## Rollback Procedure

If validation fails:

### Backend Rollback

```bash
# List recent deployments
aws elasticbeanstalk describe-environments \
  --application-name invoiceme

# Get previous version
aws elasticbeanstalk describe-application-versions \
  --application-name invoiceme

# Rollback to previous version
aws elasticbeanstalk update-environment \
  --environment-name invoiceme-prod \
  --version-label <previous-version-label>
```

### Frontend Rollback (Vercel)

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Restore from snapshot (DESTRUCTIVE - use with caution)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier invoiceme-db-restored \
  --db-snapshot-identifier <snapshot-id>
```

## Post-Validation Actions

Once all validations pass:

- [ ] Update internal documentation with production URLs
- [ ] Notify team of successful deployment
- [ ] Set up monitoring alerts
- [ ] Schedule first backup verification
- [ ] Plan next deployment cycle
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned

## Troubleshooting

### Backend Health Check Fails

1. Check EB environment status
2. View application logs
3. Verify database connectivity
4. Check security groups
5. Verify environment variables

### API Authentication Fails

1. Verify API key in environment variables
2. Check ApiKeyFilter is enabled
3. Review CORS configuration
4. Check request headers

### Frontend Can't Connect to Backend

1. Verify NEXT_PUBLIC_API_BASE_URL is correct
2. Check CORS configuration on backend
3. Verify API key is correct
4. Check browser console for errors
5. Test backend directly with curl

### Performance Issues

1. Check CloudWatch metrics
2. Review database slow query logs
3. Check connection pool settings
4. Consider scaling up instance sizes
5. Enable caching if not already

## Success Criteria

Deployment is considered successful when:

✅ All health checks pass  
✅ All CRUD operations work  
✅ Frontend loads and functions correctly  
✅ Demo account works  
✅ Data persists across restarts  
✅ Security tests pass  
✅ Performance tests meet requirements  
✅ Monitoring and logging operational  
✅ Backups configured and verified  
✅ No critical errors in logs  

## Contact and Support

- Internal documentation: [Link to wiki/confluence]
- On-call schedule: [Link to PagerDuty/schedule]
- Incident response: [Link to runbook]

