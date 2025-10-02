# Deployment Setup

## Current Deployment Status

✅ **Production URL**: https://peterental-nextjs-octs8yxcr-mark-carpenters-projects.vercel.app
✅ **GitHub Repository**: https://github.com/Mark0025/peterental-nextjs
✅ **GitHub Actions Workflow**: Created and ready

## Complete Setup Steps

### 1. Create Vercel Token for GitHub Actions

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub Actions`
4. Expiration: No expiration (or set as desired)
5. Scope: Full Account
6. Click "Create"
7. **Copy the token immediately** (it won't be shown again)

### 2. Add Token to GitHub Secrets

1. Go to https://github.com/Mark0025/peterental-nextjs/settings/secrets/actions
2. Click "New repository secret"
3. Name: `VERCEL_TOKEN`
4. Value: Paste the token from step 1
5. Click "Add secret"

### 3. Configure Production Environment Variable

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/mark-carpenters-projects/peterental-nextjs/settings/environment-variables
2. Add new variable:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://peterentalvapi-latest.onrender.com`
   - **Environment**: Production
3. Click "Save"

**Option B: Via Vercel CLI**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://peterentalvapi-latest.onrender.com
```

### 4. Trigger First Automated Deployment

After completing steps 1-3, push any change to trigger the workflow:
```bash
git commit --allow-empty -m "trigger: Test automated deployment"
git push
```

Watch the deployment at: https://github.com/Mark0025/peterental-nextjs/actions

## How It Works

1. **Push to main** → GitHub Actions workflow triggered
2. **Workflow steps**:
   - Checkout code
   - Setup Node.js 20 and pnpm
   - Install Vercel CLI
   - Pull Vercel project configuration
   - Build project artifacts
   - Deploy to Vercel production
3. **Result**: Automatic deployment to production URL

## Local Development

```bash
# Start Next.js dev server
pnpm dev

# Connect to local Python backend
# Make sure backend is running on http://localhost:8000
```

## Architecture

- **Frontend**: Next.js 15 (App Router) deployed on Vercel
- **Backend**: Python FastAPI deployed on Render
- **Connection**: Frontend calls backend via `NEXT_PUBLIC_API_URL`
- **Separate repos**: Frontend and backend are independent services

## Troubleshooting

### GitHub Action fails with "Invalid token"
- Regenerate Vercel token at https://vercel.com/account/tokens
- Update the `VERCEL_TOKEN` secret in GitHub

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set in Vercel dashboard
- Verify Python backend is running on Render
- Check CORS settings on backend allow frontend domain

### Build fails
- Check ESLint errors in GitHub Actions logs
- Run `pnpm build` locally to test
- Fix any type errors or linting issues
