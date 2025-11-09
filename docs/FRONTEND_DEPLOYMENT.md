# Frontend Deployment Guide

This guide covers deploying the ERP frontend to Vercel or other hosting platforms.

## Deployment Options

1. **Vercel** (recommended - easiest for Next.js)
2. **AWS Amplify**
3. **AWS S3 + CloudFront**
4. **Self-hosted with Docker**

## Option 1: Vercel Deployment (Recommended)

### Prerequisites

- Vercel account: https://vercel.com/signup
- GitHub repository connected to Vercel
- Backend API deployed and accessible

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Environment Variables

Create production environment variables in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add the following variables for **Production**:

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_USE_MOCK_API` | `false` | Use real backend |
| `NEXT_PUBLIC_API_BASE_URL` | Your backend URL | `https://api.yourdomain.com` or EB URL |
| `NEXT_PUBLIC_API_KEY` | Your production API key | `your-secure-api-key` |
| `NODE_ENV` | `production` | Production mode |

### Step 3: Deploy

#### Option A: Deploy via GitHub (Automatic)

1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel automatically deploys on push to `main`

#### Option B: Deploy via CLI (Manual)

```bash
cd /Users/tahmeedrahim/Documents/ERP

# Production deployment
vercel --prod

# Or with specific environment
vercel --prod --env NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

### Step 4: Configure Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as shown
4. SSL certificate is automatically provisioned

### Environment Variables Management

```bash
# List environment variables
vercel env ls

# Add environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL production

# Remove environment variable
vercel env rm NEXT_PUBLIC_API_BASE_URL production
```

## Option 2: AWS Amplify Deployment

### Step 1: Create Amplify App

```bash
# Install AWS Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify project
amplify init

# Add hosting
amplify add hosting

# Select: Hosting with Amplify Console
```

### Step 2: Configure Build Settings

Create `amplify.yml` in project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Step 3: Set Environment Variables

1. Go to **AWS Amplify Console**
2. Select your app → **Environment variables**
3. Add production environment variables:
   - `NEXT_PUBLIC_USE_MOCK_API=false`
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com`
   - `NEXT_PUBLIC_API_KEY=your-secure-api-key`

### Step 4: Deploy

```bash
# Deploy to Amplify
amplify publish
```

## Option 3: AWS S3 + CloudFront (Static Export)

### Step 1: Configure Next.js for Static Export

Add to `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

### Step 2: Build Static Files

```bash
npm run build
```

This creates an `out/` directory with static files.

### Step 3: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://invoiceme-frontend

# Enable static website hosting
aws s3 website s3://invoiceme-frontend \
  --index-document index.html \
  --error-document error.html

# Upload files
aws s3 sync out/ s3://invoiceme-frontend --delete
```

### Step 4: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name invoiceme-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

### Step 5: Configure Environment Variables

Since static export doesn't support runtime environment variables, use build-time variables:

```bash
# Build with production env vars
NEXT_PUBLIC_USE_MOCK_API=false \
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com \
NEXT_PUBLIC_API_KEY=your-secure-api-key \
npm run build
```

## Option 4: Docker Deployment (Self-Hosted)

### Step 1: Create Dockerfile

Create `Dockerfile` in frontend root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with production environment variables
ARG NEXT_PUBLIC_USE_MOCK_API
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_KEY

ENV NEXT_PUBLIC_USE_MOCK_API=$NEXT_PUBLIC_USE_MOCK_API
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Configure Next.js for Standalone Output

Add to `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default nextConfig
```

### Step 3: Build and Run

```bash
# Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_USE_MOCK_API=false \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com \
  --build-arg NEXT_PUBLIC_API_KEY=your-secure-api-key \
  -t invoiceme-frontend:latest .

# Run container
docker run -p 3000:3000 invoiceme-frontend:latest
```

## Environment Configuration

### Development vs Production

Create separate `.env` files:

**.env.development**:
```env
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=demo-api-key-12345
```

**.env.production**:
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=your-production-api-key
```

### Security Best Practices

1. **Never commit API keys** to git - use environment variables
2. **Use different API keys** for dev/staging/prod
3. **Restrict API key** by domain/IP on backend
4. **Enable CORS** only for your frontend domain
5. **Use HTTPS** for all API calls in production
6. **Rotate API keys** regularly
7. **Monitor API usage** for anomalies

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test --if-present
      
      - name: Build
        env:
          NEXT_PUBLIC_USE_MOCK_API: false
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          NEXT_PUBLIC_API_KEY: ${{ secrets.API_KEY }}
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] API connection working (check Network tab in browser)
- [ ] Demo login works
- [ ] User registration works
- [ ] Customers page loads
- [ ] Invoices page loads
- [ ] CSV export works
- [ ] Create customer works
- [ ] Create invoice works
- [ ] Record payment works
- [ ] Dashboard metrics display correctly
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Analytics working (if configured)

## Monitoring

### Vercel Analytics

Vercel provides built-in analytics:
- Page views
- Performance metrics
- Error tracking

Enable in `app/layout.tsx` (already included):
```typescript
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Custom Monitoring

Consider adding:
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and user insights
- **Google Analytics**: User behavior tracking

## Rollback

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### AWS Amplify

1. Go to Amplify Console
2. Select deployment from history
3. Click "Redeploy this version"

## Troubleshooting

### API Connection Fails

1. Check environment variables in deployment platform
2. Verify backend URL is accessible
3. Check CORS configuration on backend
4. Verify API key is correct
5. Check browser console for errors

### Build Fails

1. Check build logs for errors
2. Verify `package.json` has all dependencies
3. Test build locally: `npm run build`
4. Check Node.js version matches deployment platform

### Environment Variables Not Working

1. Verify variables are prefixed with `NEXT_PUBLIC_`
2. Rebuild after changing environment variables
3. Check deployment logs for environment variable values (not secrets)

## Cost Estimation

### Vercel
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month (team features, more bandwidth)
- **Enterprise**: Custom pricing

### AWS Amplify
- **Build minutes**: $0.01/minute
- **Data transfer**: $0.15/GB
- **Storage**: $0.023/GB/month
- Estimated: $10-50/month for small apps

### AWS S3 + CloudFront
- **S3 storage**: $0.023/GB/month
- **CloudFront data transfer**: $0.085/GB
- **CloudFront requests**: $0.0075/10,000
- Estimated: $5-20/month for small apps

