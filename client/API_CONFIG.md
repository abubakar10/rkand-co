# API Configuration Guide

## Problem
The frontend is trying to connect to `http://localhost:5000/api` in production, causing CORS errors and 404s.

## Solution
All API URLs are now centralized in `src/config/api.ts`. The configuration automatically:
- Uses `VITE_API_URL` environment variable if set
- Falls back to production URL (`https://rkand-co.onrender.com/api`) in production builds
- Uses `http://localhost:5000/api` in development

## Setting Up Production Build

### Option 1: Environment Variable (Recommended)
Set the environment variable before building:

```bash
cd client
VITE_API_URL=https://rkand-co.onrender.com/api npm run build
```

### Option 2: Create .env.production File
Create a file `client/.env.production` with:

```env
VITE_API_URL=https://rkand-co.onrender.com/api
```

Then build:
```bash
cd client
npm run build
```

### Option 3: Set in Deployment Platform
If deploying to Netlify, Vercel, or similar:

1. Go to your deployment platform's environment variables settings
2. Add: `VITE_API_URL` = `https://rkand-co.onrender.com/api`
3. Rebuild your site

**Important**: The environment variable must be set BEFORE building, not after.

## Verify Your Backend URL
Make sure `https://rkand-co.onrender.com/api` is your actual backend URL. If different, update:
1. `client/src/config/api.ts` - Update the production fallback URL
2. Set `VITE_API_URL` to your actual backend URL

## Testing
After building, check the browser console. In development, it will log the API URL being used.

## Files Updated
All files now import from `src/config/api.ts`:
- ✅ `src/contexts/AuthContext.tsx`
- ✅ `src/pages/Dashboard.tsx`
- ✅ `src/pages/BalanceSheet.tsx`
- ✅ `src/pages/CustomerReport.tsx`
- ✅ `src/pages/PurchaseReport.tsx`
- ✅ `src/pages/Sales.tsx`
- ✅ `src/pages/Purchases.tsx`
- ✅ `src/pages/Users.tsx`

