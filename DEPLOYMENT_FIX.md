# Deployment Configuration Fix

## Issues Fixed

1. **CORS Trailing Slash Mismatch**: Fixed the CORS configuration to normalize URLs (remove trailing slashes) so `https://rkandco.online` and `https://rkandco.online/` are treated as the same origin.

2. **Frontend API URL**: The frontend is already configured to use `VITE_API_URL` environment variable, but it needs to be set during build/deployment.

## Railway Deployment Settings

### Backend Service Configuration

In Railway settings for your backend service, configure the following:

#### 1. Source Section
- **Root Directory**: `server`
  - This tells Railway where your backend code is located

#### 2. Build Section
- **Watch Paths**: `/server/**`
  - This triggers redeployments when files in the server directory change
- **Custom Build Command**: `npm run build` (or leave empty for auto-detect)
  - This compiles TypeScript from `src/` to `dist/`

#### 3. Deploy Section
- **Custom Start Command**: `npm start` (or leave empty for auto-detect)
  - This runs `node dist/index.js` to start your server

#### 4. Variables Section (Environment Variables)
Add these environment variables:
- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = your secure JWT secret (use a strong random string)
- `CLIENT_URL` = your frontend URL (e.g., `https://rkandco.online` - **NO trailing slash**)
- `PORT` = Railway will auto-assign this, but you can set it if needed

### Quick Reference
- **Root Directory**: `server`
- **Watch Path**: `/server/**`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## Required Configuration

### Backend (Server) Environment Variables

Create a `.env` file in the `server/` directory with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=https://rkandco.online
```

**Important**: 
- `CLIENT_URL` should NOT have a trailing slash
- Use your actual MongoDB connection string
- Use a strong, random JWT secret in production

### Frontend (Client) Environment Variables

When building your frontend, set the `VITE_API_URL` environment variable to point to your deployed backend:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

**For Vite builds**, you need to set this before running `npm run build`:

```bash
# Example for production build
VITE_API_URL=https://api.rkandco.online/api npm run build
```

Or create a `.env.production` file in the `client/` directory:

```env
VITE_API_URL=https://api.rkandco.online/api
```

## Deployment Steps

### Backend Deployment (Render)

1. **Deploy your backend** to Render
   - Backend URL: `https://rkand-co.onrender.com`
   - Make sure `CLIENT_URL` environment variable is set to `https://rkandco.online` (NO trailing slash)
   - Other required env vars: `MONGO_URI`, `JWT_SECRET`, `PORT` (auto-assigned)

2. **MongoDB Atlas IP Whitelist**:
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
   - This is required because Render uses dynamic IPs

### Frontend Deployment (Netlify)

1. **Set Environment Variable in Netlify**:
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://rkand-co.onrender.com/api`
   - **Important**: This must be set BEFORE building, or rebuild after setting it

2. **Rebuild your site**:
   - Go to Deploys → Trigger deploy → Clear cache and deploy site
   - Or push a new commit to trigger auto-deploy
   - Netlify will rebuild with the correct `VITE_API_URL`

3. **Alternative: Build locally and deploy**:
   ```bash
   cd client
   # Create .env.production file
   echo "VITE_API_URL=https://rkand-co.onrender.com/api" > .env.production
   npm run build
   # Deploy the dist/ folder to Netlify
   ```

## Testing

After deployment:
- Frontend should call your deployed backend URL (not localhost)
- CORS errors should be resolved
- 404 errors should be gone

## Current Code Changes

- ✅ Fixed CORS to normalize origin URLs (handles trailing slash)
- ✅ Updated `env.ts` to normalize `CLIENT_URL`
- ✅ Frontend already uses `VITE_API_URL` (just needs to be set)

---

## Free Alternatives to Railway

Since Railway's free trial has expired, here are the best **free alternatives** for deploying your Node.js backend:

### 🥇 **1. Render** (Recommended - Easiest)
**Free Tier**: 750 hours/month, spins down after 15 min inactivity

**Setup Steps:**
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rk-co-backend` (or any name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = your secure JWT secret
   - `CLIENT_URL` = your frontend URL (no trailing slash)
   - `NODE_ENV` = `production`
6. Click "Create Web Service"

**Pros**: Very similar to Railway, easy setup, auto-deploy from GitHub
**Cons**: Spins down after inactivity (first request takes ~30 seconds)

---

### 🥈 **2. Fly.io** (Best Performance)
**Free Tier**: 3 shared-cpu-1x VMs, 3GB persistent volume

**Setup Steps:**
1. Install Fly CLI: `npm install -g @fly/cli`
2. Sign up at [fly.io](https://fly.io)
3. In your `server` directory, run: `fly launch`
4. Follow prompts:
   - Select your app name
   - Select region (choose closest to you)
   - Don't deploy a Postgres/Redis (you're using MongoDB)
5. Create `fly.toml` in `server/` directory (or edit the generated one):
   ```toml
   app = "your-app-name"
   primary_region = "iad"  # or your preferred region

   [build]
     builder = "paketobuildpacks/builder:base"

   [http_service]
     internal_port = 5000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[services]]
     http_checks = []
     internal_port = 5000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []

     [services.concurrency]
       type = "connections"
       hard_limit = 25
       soft_limit = 20

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.tcp_checks]]
       grace_period = "1s"
       interval = "15s"
       restart_limit = 0
       timeout = "2s"
       timeout = "2s"
   ```
6. Set secrets: `fly secrets set MONGO_URI=your_uri JWT_SECRET=your_secret CLIENT_URL=your_url`
7. Deploy: `fly deploy`

**Pros**: Always-on free tier, fast, great performance
**Cons**: Requires CLI, slightly more complex setup

---

### 🥉 **3. Cyclic.sh** (Simplest)
**Free Tier**: Unlimited apps, 512MB RAM, auto-scales

**Setup Steps:**
1. Go to [cyclic.sh](https://cyclic.sh) and sign up with GitHub
2. Click "Deploy Now"
3. Select your repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables in the dashboard
6. Deploy!

**Pros**: Easiest setup, no credit card needed, always-on
**Cons**: Limited resources on free tier

---

### 4. **Koyeb**
**Free Tier**: 2 services, 512MB RAM each

**Setup Steps:**
1. Go to [koyeb.com](https://koyeb.com) and sign up
2. Click "Create App"
3. Connect GitHub repository
4. Configure:
   - **Name**: Your app name
   - **Buildpack**: Node.js (auto-detected)
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
5. Add Environment Variables
6. Deploy!

**Pros**: Simple, good free tier
**Cons**: Limited to 2 services on free tier

---

### 5. **Vercel** (Serverless - Good for APIs)
**Free Tier**: Unlimited serverless functions

**Setup Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. In `server/` directory, create `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ]
   }
   ```
3. Run `vercel` in the `server/` directory
4. Set environment variables in Vercel dashboard

**Pros**: Excellent for serverless, fast
**Cons**: Requires serverless adaptation, cold starts

---

## Recommended Choice

**For easiest migration from Railway**: Use **Render** - it's the most similar experience.

**For best performance**: Use **Fly.io** - always-on free tier.

**For simplest setup**: Use **Cyclic.sh** - just connect and deploy.

---

## Quick Migration Checklist

For any platform, you'll need:
- ✅ Root Directory: `server`
- ✅ Build Command: `npm install && npm run build`
- ✅ Start Command: `npm start`
- ✅ Environment Variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CLIENT_URL` (no trailing slash)
  - `PORT` (usually auto-assigned)
  - `NODE_ENV=production`

