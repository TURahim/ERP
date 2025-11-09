# AWS Deployment Guide

This guide covers deploying the ERP Backend to AWS with PostgreSQL RDS and Elastic Beanstalk.

## Architecture Overview

```
Internet → ALB → Elastic Beanstalk (Backend) → RDS PostgreSQL
                            ↓
                    SSM Parameter Store / Secrets Manager
```

### Components

- **RDS PostgreSQL**: Managed database service
- **Elastic Beanstalk**: Managed application hosting (Java or Docker platform)
- **Application Load Balancer (ALB)**: HTTPS termination and routing
- **Systems Manager Parameter Store**: Environment variables and secrets
- **ACM (Certificate Manager)**: SSL/TLS certificates
- **Security Groups**: Network access control

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured: `aws configure`
- Domain name (optional, for custom domain with ACM)
- Docker (for Docker deployment option)

## Step 1: Create RDS PostgreSQL Database

### Option A: AWS Console

1. Navigate to **RDS Console** → **Create database**
2. Configuration:
   - **Engine**: PostgreSQL 16.x
   - **Template**: Free tier (dev) or Production
   - **DB instance identifier**: `invoiceme-db`
   - **Master username**: `invoiceme_admin`
   - **Master password**: (generate strong password)
   - **DB instance class**: db.t3.micro (free tier) or larger
   - **Storage**: 20 GB GP3 (scalable)
   - **Multi-AZ**: No (dev) or Yes (production)
   - **VPC**: Default or custom
   - **Public access**: No (recommended)
   - **VPC security group**: Create new
   - **Database name**: `invoiceme`

3. Click **Create database**
4. Wait for status: Available (~10 minutes)
5. Note the **Endpoint** (e.g., `invoiceme-db.xxxxx.us-east-1.rds.amazonaws.com`)

### Option B: AWS CLI

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name invoiceme-subnet-group \
  --db-subnet-group-description "Subnet group for InvoiceMe DB" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group
aws ec2 create-security-group \
  --group-name invoiceme-db-sg \
  --description "Security group for InvoiceMe database"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier invoiceme-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username invoiceme_admin \
  --master-user-password 'YourStrongPassword123!' \
  --allocated-storage 20 \
  --db-name invoiceme \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name invoiceme-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"
```

### Security Group Configuration

Allow inbound traffic from Elastic Beanstalk security group:

```bash
# Get EB security group ID (after creating EB environment)
EB_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=awseb-*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow EB to access RDS
aws ec2 authorize-security-group-ingress \
  --group-id <RDS_SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 5432 \
  --source-group $EB_SG_ID
```

## Step 2: Store Secrets in AWS Systems Manager

Store sensitive configuration in Parameter Store:

```bash
# Database connection string
aws ssm put-parameter \
  --name "/invoiceme/prod/db-url" \
  --value "jdbc:postgresql://invoiceme-db.xxxxx.us-east-1.rds.amazonaws.com:5432/invoiceme" \
  --type "String"

# Database username
aws ssm put-parameter \
  --name "/invoiceme/prod/db-username" \
  --value "invoiceme_admin" \
  --type "String"

# Database password (SecureString for encryption)
aws ssm put-parameter \
  --name "/invoiceme/prod/db-password" \
  --value "YourStrongPassword123!" \
  --type "SecureString"

# API Key
aws ssm put-parameter \
  --name "/invoiceme/prod/api-key" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString"
```

## Step 3: Deploy Backend to Elastic Beanstalk

### Option A: Java Platform (JAR deployment)

1. **Create Elastic Beanstalk Application**:
   ```bash
   aws elasticbeanstalk create-application \
     --application-name invoiceme \
     --description "InvoiceMe ERP Backend"
   ```

2. **Create Environment**:
   ```bash
   aws elasticbeanstalk create-environment \
     --application-name invoiceme \
     --environment-name invoiceme-prod \
     --solution-stack-name "64bit Amazon Linux 2023 v4.0.0 running Corretto 17" \
     --option-settings \
       file://eb-options.json
   ```

3. **eb-options.json**:
   ```json
   [
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_PROFILES_ACTIVE",
       "Value": "prod"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_URL",
       "Value": "jdbc:postgresql://invoiceme-db.xxxxx.us-east-1.rds.amazonaws.com:5432/invoiceme"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_USERNAME",
       "Value": "invoiceme_admin"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_PASSWORD",
       "Value": "YourStrongPassword123!"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "API_KEY",
       "Value": "your-secure-api-key"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SERVER_PORT",
       "Value": "5000"
     },
     {
       "Namespace": "aws:autoscaling:launchconfiguration",
       "OptionName": "InstanceType",
       "Value": "t3.small"
     }
   ]
   ```

4. **Deploy JAR**:
   ```bash
   # Build JAR
   ./mvnw clean package -DskipTests
   
   # Create application version
   aws elasticbeanstalk create-application-version \
     --application-name invoiceme \
     --version-label v1.0.0 \
     --source-bundle S3Bucket=my-eb-bucket,S3Key=invoiceme-backend.jar
   
   # Deploy
   aws elasticbeanstalk update-environment \
     --environment-name invoiceme-prod \
     --version-label v1.0.0
   ```

### Option B: Docker Platform (recommended for consistency)

1. **Build and push Docker image**:
   ```bash
   # Build image
   docker build -t invoiceme-backend:latest .
   
   # Tag for ECR
   aws ecr create-repository --repository-name invoiceme-backend
   ECR_URI=$(aws ecr describe-repositories --repository-names invoiceme-backend --query 'repositories[0].repositoryUri' --output text)
   
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
   
   # Tag and push
   docker tag invoiceme-backend:latest $ECR_URI:latest
   docker push $ECR_URI:latest
   ```

2. **Create Dockerrun.aws.json**:
   ```json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": {
       "Name": "<ECR_URI>:latest",
       "Update": "true"
     },
     "Ports": [
       {
         "ContainerPort": 8080,
         "HostPort": 8080
       }
     ],
     "Logging": "/var/log/backend"
   }
   ```

3. **Deploy to Elastic Beanstalk**:
   ```bash
   # Create application version
   zip -r backend-docker.zip Dockerrun.aws.json
   
   aws s3 cp backend-docker.zip s3://my-eb-bucket/backend-docker.zip
   
   aws elasticbeanstalk create-application-version \
     --application-name invoiceme \
     --version-label v1.0.0-docker \
     --source-bundle S3Bucket=my-eb-bucket,S3Key=backend-docker.zip
   
   # Create environment with Docker platform
   aws elasticbeanstalk create-environment \
     --application-name invoiceme \
     --environment-name invoiceme-prod \
     --solution-stack-name "64bit Amazon Linux 2023 v4.0.0 running Docker" \
     --option-settings file://eb-docker-options.json
   ```

## Step 4: Configure HTTPS with ACM

1. **Request Certificate** (if using custom domain):
   ```bash
   aws acm request-certificate \
     --domain-name api.yourdomain.com \
     --validation-method DNS
   ```

2. **Add DNS validation records** in your DNS provider

3. **Configure ALB HTTPS listener**:
   - Go to **EC2 Console** → **Load Balancers**
   - Select EB load balancer
   - Add HTTPS:443 listener
   - Select ACM certificate
   - Forward to target group

## Step 5: Configure Auto Scaling

```bash
# Update environment configuration
aws elasticbeanstalk update-environment \
  --environment-name invoiceme-prod \
  --option-settings \
    Namespace=aws:autoscaling:asg,OptionName=MinSize,Value=2 \
    Namespace=aws:autoscaling:asg,OptionName=MaxSize,Value=4 \
    Namespace=aws:autoscaling:trigger,OptionName=MeasureName,Value=CPUUtilization \
    Namespace=aws:autoscaling:trigger,OptionName=UpperThreshold,Value=70 \
    Namespace=aws:autoscaling:trigger,OptionName=LowerThreshold,Value=30
```

## Step 6: Monitoring and Logging

### CloudWatch Logs

```bash
# Enable CloudWatch Logs streaming
aws elasticbeanstalk update-environment \
  --environment-name invoiceme-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=StreamLogs,Value=true \
    Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=DeleteOnTerminate,Value=false \
    Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=RetentionInDays,Value=7
```

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name invoiceme-db-connections \
  --alarm-description "Alert when DB connections are high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile | `prod` |
| `SPRING_DATASOURCE_URL` | Database JDBC URL | `jdbc:postgresql://...` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `invoiceme_admin` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | (secure string) |
| `API_KEY` | API authentication key | (secure string) |
| `SERVER_PORT` | Application port | `5000` (EB default) |
| `JAVA_OPTS` | JVM options | `-Xms512m -Xmx1024m` |

## Cost Optimization

### Development Environment
- RDS: db.t3.micro (free tier eligible)
- EB: t3.micro (free tier eligible)
- Single AZ deployment
- Estimated cost: ~$15-30/month

### Production Environment
- RDS: db.t3.small or larger (Multi-AZ)
- EB: t3.small or larger (Auto Scaling 2-4 instances)
- Multi-AZ deployment
- Backup retention: 7-30 days
- Estimated cost: ~$100-200/month

## Disaster Recovery

### Automated Backups

RDS automatically creates daily backups with point-in-time recovery:
- Retention period: 7-35 days
- Backup window: Off-peak hours
- Recovery: Restore to any point within retention

### Manual Snapshots

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier invoiceme-db \
  --db-snapshot-identifier invoiceme-backup-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier invoiceme-db-restored \
  --db-snapshot-identifier invoiceme-backup-20250101
```

## Troubleshooting

### Application Won't Start

1. Check environment logs:
   ```bash
   eb logs
   ```

2. Verify environment variables are set correctly

3. Check security group allows traffic between EB and RDS

### Database Connection Errors

1. Verify RDS endpoint and credentials
2. Check security group inbound rules on RDS
3. Test connectivity from EB instance:
   ```bash
   eb ssh
   telnet <RDS_ENDPOINT> 5432
   ```

### High Latency

1. Enable CloudWatch detailed monitoring
2. Check database connection pool settings
3. Consider RDS instance upgrade
4. Add read replicas for read-heavy workloads

## Security Best Practices

1. **Never hardcode credentials** - Use Parameter Store or Secrets Manager
2. **Enable encryption at rest** - RDS storage encryption
3. **Enable encryption in transit** - SSL/TLS for RDS connections
4. **Least privilege IAM roles** - Grant minimum necessary permissions
5. **Regular security patches** - Enable automated platform updates
6. **VPC isolation** - Keep RDS in private subnet
7. **Audit logging** - Enable RDS audit logs and CloudTrail
8. **Secrets rotation** - Rotate database passwords regularly
9. **DDoS protection** - Use AWS Shield Standard (included)
10. **WAF** - Consider AWS WAF for application layer protection

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, CodePipeline)
2. Implement blue/green deployments
3. Add APM (Application Performance Monitoring)
4. Set up alerting with SNS/PagerDuty
5. Implement database migration tool (Flyway)

