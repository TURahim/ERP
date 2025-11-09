# Observability and Monitoring

This document outlines future enhancements for monitoring, logging, metrics, and alerting for the ERP system.

## Current State

### Backend Monitoring
- ✅ Spring Boot Actuator health endpoint (`/actuator/health`)
- ✅ Basic logging to console/file
- ✅ CloudWatch Logs integration (when deployed to AWS EB)

### Frontend Monitoring
- ✅ Vercel Analytics (if deployed to Vercel)
- ✅ Browser console logging

### Database Monitoring
- ✅ RDS basic metrics (CPU, connections, storage)
- ✅ Automated backups

## Recommended Enhancements

### Phase 1: Essential Monitoring (High Priority)

#### 1. AWS CloudWatch Dashboards

**Purpose**: Centralized view of application and infrastructure metrics

**Implementation**:

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name InvoiceMeProduction \
  --dashboard-body file://cloudwatch-dashboard.json
```

**cloudwatch-dashboard.json**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ElasticBeanstalk", "EnvironmentHealth", {"stat": "Average"}],
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "System Health Overview"
      }
    }
  ]
}
```

**Metrics to Track**:
- Backend: Request count, latency, error rate
- Database: CPU, connections, disk I/O, query latency
- Frontend: Page load time, error rate

#### 2. CloudWatch Alarms

**Critical Alerts**:

```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name 5XXError \
  --namespace AWS/ElasticBeanstalk \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Database CPU high
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-db-high-cpu \
  --alarm-description "Alert when DB CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Low database storage
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-db-low-storage \
  --alarm-description "Alert when DB storage below 10%" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2147483648 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Backend instance health
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-backend-unhealthy \
  --alarm-description "Alert when backend instances are unhealthy" \
  --metric-name EnvironmentHealth \
  --namespace AWS/ElasticBeanstalk \
  --statistic Average \
  --period 300 \
  --threshold 15 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

**SNS Topic for Alerts**:
```bash
# Create SNS topic
aws sns create-topic --name invoiceme-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:invoiceme-alerts \
  --protocol email \
  --notification-endpoint your-email@company.com
```

#### 3. Structured Logging

**Update logback-spring.xml**:

Create `src/main/resources/logback-spring.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <!-- Console appender with color -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- File appender with JSON format for production -->
    <springProfile name="prod">
        <appender name="JSON_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>/var/log/invoiceme/application.log</file>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <customFields>{"app":"invoiceme","env":"production"}</customFields>
            </encoder>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>/var/log/invoiceme/application-%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
        </appender>
        
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
            <appender-ref ref="JSON_FILE"/>
        </root>
    </springProfile>
    
    <!-- Development logging -->
    <springProfile name="!prod">
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
    
    <!-- Package-level logging -->
    <logger name="com.invoiceme.erp" level="INFO"/>
    <logger name="org.springframework.web" level="WARN"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
</configuration>
```

**Add dependency to pom.xml**:
```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

#### 4. Application Metrics with Micrometer

Spring Boot Actuator includes Micrometer for metrics. Export to CloudWatch:

**Add dependency to pom.xml**:
```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-cloudwatch2</artifactId>
</dependency>
```

**Configure in application-prod.properties**:
```properties
# Micrometer CloudWatch
management.metrics.export.cloudwatch.namespace=InvoiceMe
management.metrics.export.cloudwatch.batch-size=20
management.metrics.export.cloudwatch.step=1m
management.metrics.distribution.percentiles-histogram.http.server.requests=true

# Custom metrics
management.endpoints.web.exposure.include=health,info,metrics,prometheus
```

**Custom Metrics in Code**:
```java
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;

@Service
public class CustomerService {
    private final Counter customerCreatedCounter;
    
    public CustomerService(MeterRegistry registry) {
        this.customerCreatedCounter = registry.counter("customers.created");
    }
    
    public Customer createCustomer(CreateCustomerRequest request) {
        // ... create customer logic ...
        customerCreatedCounter.increment();
        return customer;
    }
}
```

### Phase 2: Advanced Monitoring (Medium Priority)

#### 5. Distributed Tracing with AWS X-Ray

**Purpose**: Trace requests across services, identify bottlenecks

**Implementation**:

Add dependency:
```xml
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-spring</artifactId>
    <version>2.14.0</version>
</dependency>
```

Configure:
```java
@Configuration
public class XRayConfig {
    @Bean
    public Filter TracingFilter() {
        return new AWSXRayServletFilter("InvoiceMe");
    }
}
```

Enable in EB:
```bash
aws elasticbeanstalk update-environment \
  --environment-name invoiceme-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:xray,OptionName=XRayEnabled,Value=true
```

#### 6. APM (Application Performance Monitoring)

**Option A: AWS X-Ray** (Native AWS, already covered above)

**Option B: New Relic**

```xml
<dependency>
    <groupId>com.newrelic.agent.java</groupId>
    <artifactId>newrelic-java</artifactId>
    <version>8.7.0</version>
</dependency>
```

Configure via environment variables:
```
NEW_RELIC_APP_NAME=InvoiceMe
NEW_RELIC_LICENSE_KEY=your-license-key
```

**Option C: Datadog**

```xml
<dependency>
    <groupId>com.datadoghq</groupId>
    <artifactId>dd-java-agent</artifactId>
    <version>1.20.0</version>
</dependency>
```

**Features**:
- Request tracing
- Database query analysis
- Error tracking
- Performance insights
- Custom dashboards

**Cost**: ~$15-100/month depending on scale

#### 7. Error Tracking with Sentry

**Backend Integration**:

Add to pom.xml:
```xml
<dependency>
    <groupId>io.sentry</groupId>
    <artifactId>sentry-spring-boot-starter</artifactId>
    <version>6.32.0</version>
</dependency>
```

Configure in application-prod.properties:
```properties
sentry.dsn=https://your-dsn@sentry.io/project-id
sentry.environment=production
sentry.traces-sample-rate=0.5
```

**Frontend Integration** (already in place if using Vercel):

```typescript
// app/error.tsx
'use client'

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return <div>Something went wrong!</div>
}
```

#### 8. Database Query Performance Monitoring

**Enable Slow Query Log in RDS**:

```bash
# Create parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name invoiceme-pg \
  --db-parameter-group-family postgres16 \
  --description "Custom parameters for InvoiceMe"

# Set slow query log threshold (log queries > 1 second)
aws rds modify-db-parameter-group \
  --db-parameter-group-name invoiceme-pg \
  --parameters \
    "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" \
    "ParameterName=log_statement,ParameterValue=all,ApplyMethod=immediate"

# Apply to RDS instance
aws rds modify-db-instance \
  --db-instance-identifier invoiceme-db \
  --db-parameter-group-name invoiceme-pg
```

**Query CloudWatch Insights**:
```sql
fields @timestamp, @message
| filter @message like /duration:/
| parse @message "duration: * ms" as duration
| filter duration > 1000
| sort duration desc
| limit 20
```

### Phase 3: Advanced Observability (Lower Priority)

#### 9. Synthetic Monitoring

**Purpose**: Proactively test application availability from different regions

**AWS CloudWatch Synthetics**:

```javascript
// canary-script.js
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanary = async function () {
    const requestOptions = {
        hostname: 'your-backend-url.com',
        path: '/actuator/health',
        method: 'GET',
        headers: {
            'X-API-Key': process.env.API_KEY
        }
    };
    
    let response = await synthetics.executeHttpStep('HealthCheck', requestOptions);
    
    if (response.statusCode !== 200) {
        throw new Error(`Health check failed: ${response.statusCode}`);
    }
};

exports.handler = async () => {
    return await apiCanary();
};
```

Deploy:
```bash
aws synthetics create-canary \
  --name invoiceme-health-check \
  --artifact-s3-location s3://my-canary-results/invoiceme \
  --execution-role-arn arn:aws:iam::ACCOUNT_ID:role/CloudWatchSyntheticsRole \
  --schedule Expression="rate(5 minutes)" \
  --code file://canary-script.js \
  --runtime-version syn-nodejs-puppeteer-6.0
```

**Alternative: Uptime Robot** (simpler, external service)
- Free tier: 50 monitors, 5-minute intervals
- Alerts via email, SMS, Slack

#### 10. Log Aggregation and Analysis

**AWS CloudWatch Logs Insights** (included):

Example queries:

```sql
# Top 10 slowest API endpoints
fields @timestamp, request_uri, response_time
| filter @message like /response_time/
| sort response_time desc
| limit 10

# Error rate by endpoint
fields request_uri
| filter status >= 400
| stats count() as error_count by request_uri
| sort error_count desc

# Customer creation failures
fields @timestamp, @message
| filter @message like /CustomerService/
| filter level = "ERROR"
| sort @timestamp desc
```

**ELK Stack** (self-hosted, advanced):
- Elasticsearch: Store logs
- Logstash: Parse and transform
- Kibana: Visualize and search

**Alternative: AWS OpenSearch Service**

#### 11. Business Metrics Dashboard

**Purpose**: Monitor business KPIs, not just technical metrics

**Metrics to Track**:
- New customers per day/week
- Invoices created per day/week
- Payments received (count and amount)
- Outstanding balance trend
- Average invoice value
- Payment success rate
- Customer growth rate

**Implementation**:

Create custom metrics in services:

```java
@Service
public class InvoiceService {
    private final MeterRegistry registry;
    
    public void createInvoice(CreateInvoiceRequest request) {
        Invoice invoice = // ... create logic ...
        
        // Record business metric
        registry.counter("business.invoices.created").increment();
        registry.gauge("business.invoices.value", invoice.getTotal());
        
        return invoice;
    }
}
```

Create CloudWatch dashboard for business metrics.

#### 12. Real User Monitoring (RUM)

**Purpose**: Understand actual user experience

**AWS CloudWatch RUM**:

```javascript
// app/layout.tsx
import { AwsRum } from 'aws-rum-web';

const awsRum = new AwsRum({
  applicationId: 'your-application-id',
  applicationVersion: '1.0.0',
  applicationRegion: 'us-east-1',
  endpoint: 'https://dataplane.rum.us-east-1.amazonaws.com',
  sessionSampleRate: 1.0,
  telemetries: [
    'performance',
    'errors',
    'http'
  ]
});
```

**Google Analytics 4** (alternative):

```typescript
// lib/analytics.ts
export const pageview = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

### Phase 4: Automation and Intelligence

#### 13. Automated Alerting Workflow

**PagerDuty Integration**:

```bash
# SNS -> PagerDuty
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:invoiceme-alerts \
  --protocol https \
  --notification-endpoint https://events.pagerduty.com/integration/YOUR_KEY/enqueue
```

**Slack Integration**:

```bash
# SNS -> Lambda -> Slack
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:invoiceme-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:ACCOUNT_ID:function:SlackNotifier
```

#### 14. Predictive Alerting with CloudWatch Anomaly Detection

```bash
aws cloudwatch put-anomaly-detector \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=invoiceme-db \
  --stat Average

aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-db-cpu-anomaly \
  --comparison-operator LessThanLowerOrGreaterThanUpperThreshold \
  --evaluation-periods 2 \
  --threshold-metric-id e1
```

#### 15. Automated Remediation

**AWS Systems Manager Automation**:

Example: Restart EB environment on repeated health check failures

```yaml
# restart-eb-environment.yaml
schemaVersion: '0.3'
assumeRole: '{{ AutomationAssumeRole }}'
parameters:
  EnvironmentName:
    type: String
    description: Elastic Beanstalk environment name
mainSteps:
  - name: RestartEnvironment
    action: 'aws:executeAwsApi'
    inputs:
      Service: elasticbeanstalk
      Api: RestartAppServer
      EnvironmentName: '{{ EnvironmentName }}'
```

## Monitoring Costs (Estimates)

### AWS Native (Minimal Cost)
- CloudWatch: ~$10-30/month (logs, metrics, alarms)
- X-Ray: ~$5-20/month (traces)
- **Total**: ~$15-50/month

### APM (New Relic, Datadog)
- Standard plan: ~$75-150/month
- Pro plan: ~$150-300/month

### Full Stack (AWS + APM + RUM)
- **Total**: ~$100-400/month

## Implementation Priority

### Must Have (Before Production)
1. ✅ Health checks (already implemented)
2. ✅ Basic logging (already implemented)
3. 🔴 CloudWatch alarms (critical errors, high CPU)
4. 🔴 SNS alerts to team email

### Should Have (First Month)
5. 🟡 CloudWatch dashboard
6. 🟡 Structured JSON logging
7. 🟡 Database slow query logs
8. 🟡 Custom business metrics

### Nice to Have (Second Month)
9. 🟢 APM (New Relic or Datadog)
10. 🟢 Error tracking (Sentry)
11. 🟢 Distributed tracing (X-Ray)
12. 🟢 Synthetic monitoring

### Future Enhancements
13. 🔵 Real user monitoring
14. 🔵 Anomaly detection
15. 🔵 Automated remediation

## Resources

- **AWS CloudWatch**: https://docs.aws.amazon.com/cloudwatch/
- **Spring Boot Actuator**: https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html
- **Micrometer**: https://micrometer.io/docs
- **New Relic**: https://newrelic.com/
- **Datadog**: https://www.datadoghq.com/
- **Sentry**: https://sentry.io/
- **PagerDuty**: https://www.pagerduty.com/

## Next Steps

1. Review and prioritize monitoring requirements
2. Set up basic CloudWatch alarms (Phase 1, items 1-2)
3. Implement structured logging (Phase 1, item 3)
4. Create runbook for common alerts
5. Schedule monthly review of monitoring data
6. Adjust thresholds based on actual usage patterns

