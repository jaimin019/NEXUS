# NEXUS — Deployment Guide

This guide covers the step-by-step instructions for deploying the **NEXUS — Industrial Knowledge Intelligence Platform** to production environments (such as Vercel for the frontend and Render/Railway/EC2 for the backend).

---

## 1. Prerequisites & Services Setup

### A. MongoDB Atlas (Database & Vector Search)
1. Create a free **M0 Cluster** on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with `readWriteAnyDatabase` permissions and save the connection string (`MONGODB_URI`).
3. Under **Network Access**, add `0.0.0.0/0` (or the specific IP ranges of your backend hosting service).
4. Once your backend is deployed and connected, run the vector search index creation script:
   ```bash
   node server/scripts/createVectorIndex.js
   ```

### B. Groq API (LLM Engine)
1. Sign up at [console.groq.com](https://console.groq.com/) and generate a free API key (`GROQ_API_KEY`).
2. NEXUS uses `llama-3.3-70b-versatile` for agent reasoning, entity extraction, and query synthesis.

### C. Upstash Redis (Background Processing Queue)
1. Create a free Redis database at [upstash.com](https://upstash.com/).
2. Enable TLS/SSL and copy the connection credentials:
   - `UPSTASH_REDIS_URL` (`rediss://default:token@host.upstash.io:6379`)
   - `UPSTASH_REDIS_TOKEN`
   - `UPSTASH_REDIS_HOST`
   - `UPSTASH_REDIS_PORT` (typically `6379`)

---

## 2. Backend Deployment (Render / Railway / Fly.io)

### Example: Deploying to Render
1. Create a new **Web Service** on [Render](https://render.com/) and connect your GitHub repository.
2. Configure the build and start commands:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
3. Add the following **Environment Variables** in the Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `UPSTASH_REDIS_URL`: Your Upstash connection URL (`rediss://...`)
   - `UPSTASH_REDIS_TOKEN`: Your Upstash token
   - `UPSTASH_REDIS_HOST`: Your Upstash hostname
   - `UPSTASH_REDIS_PORT`: `6379`
   - `JWT_SECRET`: A secure random string (min 32 characters)
   - `PORT`: `5000` (or let Render assign automatically)
   - `NODE_ENV`: `production`
4. Once deployed, run the demo data seeding script from the console or via post-deploy hook:
   ```bash
   node scripts/seedDemoData.js
   ```

---

## 3. Frontend Deployment (Vercel / Netlify)

### Example: Deploying to Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com/).
2. Configure project settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variables**:
   - `VITE_API_URL`: Your deployed backend API endpoint (e.g., `https://nexus-api.onrender.com/api`)
4. Click **Deploy**. Vercel will build the React single-page application and serve it over global CDN.

---

## 4. Verification & Post-Deployment Checklist

1. **Verify Health Endpoint**: Visit `https://your-backend-url.com/api/health` to confirm the backend, database, vector index, and Redis connection are healthy.
2. **Demo Login Check**: Visit the deployed Vercel frontend, navigate to `/login`, and sign in using:
   - **Email**: `demo@nexus.ai`
   - **Password**: `nexus2026`
3. **ORACLE Query Test**: Ask ORACLE `"What is the isolation procedure for P-101?"` and verify streaming responses and document citations.
4. **SYNAPSE Graph Check**: Verify that the interactive D3.js knowledge graph renders all seeded nodes and relationships cleanly.
