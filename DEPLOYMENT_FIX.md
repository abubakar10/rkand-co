# Deployment Configuration Fix

## Issues Fixed

1. **CORS Trailing Slash Mismatch**: Fixed the CORS configuration to normalize URLs (remove trailing slashes) so `https://rkandco.online` and `https://rkandco.online/` are treated as the same origin.

2. **Frontend API URL**: The frontend is already configured to use `VITE_API_URL` environment variable, but it needs to be set during build/deployment.

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

1. **Deploy your backend** to a server (not localhost!)
   - Make sure it's accessible via HTTPS
   - Update `CLIENT_URL` in backend `.env` to `https://rkandco.online` (no trailing slash)

2. **Set frontend environment variable** before building:
   - Create `.env.production` in `client/` directory
   - Set `VITE_API_URL` to your backend URL (e.g., `https://api.rkandco.online/api`)

3. **Build and deploy frontend**:
   ```bash
   cd client
   npm run build
   # Deploy the dist/ folder to your hosting
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

