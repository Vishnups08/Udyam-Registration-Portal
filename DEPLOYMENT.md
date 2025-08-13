# Deployment Guide

## Frontend Deployment (Vercel)

### 1. Prepare Repository
```bash
# Ensure you're in the frontend directory
cd frontend

# Install Vercel CLI
npm i -g vercel
```

### 2. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy (this will create a new project)
vercel

# Follow the prompts:
# - Set project name: openbiz-frontend
# - Set build command: npm run build
# - Set output directory: .next
# - Set install command: npm install
```

### 3. Configure Environment Variables
In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_BACKEND_URL` = `https://your-railway-backend-url.railway.app`
3. Redeploy after adding env vars

### 4. Custom Domain (Optional)
- Go to Settings → Domains
- Add your custom domain
- Update DNS records as instructed

---

## Backend Deployment (Railway)

### 1. Prepare Repository
```bash
# Ensure you're in the backend directory
cd backend

# Install Railway CLI
npm i -g @railway/cli
```

### 2. Deploy to Railway
```bash
# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables
In Railway dashboard:
1. Go to your project → Variables
2. Add:
   ```
   PORT=4000
   DATABASE_URL=your_postgres_connection_string
   NODE_ENV=production
   ```

### 4. Set Up Database
```bash
# Connect to Railway shell
railway shell

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 5. Get Backend URL
- Go to Railway dashboard → Deployments
- Copy the generated URL (e.g., `https://openbiz-backend-production.up.railway.app`)
- Update Vercel env var `NEXT_PUBLIC_BACKEND_URL` with this URL

---

## Database Setup

### Option 1: Railway PostgreSQL
1. In Railway dashboard, create a new PostgreSQL service
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `railway run npx prisma migrate deploy`

### Option 2: External PostgreSQL
1. Use services like:
   - [Neon](https://neon.tech) (free tier available)
   - [Supabase](https://supabase.com) (free tier available)
   - [PlanetScale](https://planetscale.com) (free tier available)
2. Copy connection string to Railway `DATABASE_URL`

---

## Post-Deployment

### 1. Test Frontend
- Visit your Vercel URL
- Test form submission
- Verify backend connectivity

### 2. Test Backend
```bash
# Test health endpoint
curl https://your-railway-backend-url.railway.app/health

# Test form schema endpoint
curl https://your-railway-backend-url.railway.app/form-schema/1
```

### 3. Monitor Logs
```bash
# Railway logs
railway logs

# Vercel logs
vercel logs
```

---

## Troubleshooting

### Frontend Issues
- **Build fails**: Check `vercel.json` and `package.json` scripts
- **API calls fail**: Verify `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars
- **Styling issues**: Ensure Tailwind CSS is properly configured

### Backend Issues
- **Database connection**: Verify `DATABASE_URL` format and accessibility
- **Prisma errors**: Run `railway run npx prisma generate` after deployment
- **Port binding**: Railway automatically sets `PORT` env var

### Common Commands
```bash
# Redeploy frontend
vercel --prod

# Redeploy backend
railway up

# Check backend status
railway status

# View backend logs
railway logs
```

---

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth/month, 100 serverless function executions/day
- Pro: $20/month for unlimited bandwidth and functions

### Railway
- Free tier: $5 credit/month
- Pro: Pay-as-you-use pricing
- Database: ~$5-10/month for small PostgreSQL instances

### Recommendations
- Use free tiers for development/testing
- Upgrade to paid plans for production workloads
- Monitor usage in both dashboards 