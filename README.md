# 🏭 NEXUS
```
N   N  EEEEE  X   X  U   U  SSSS
NN  N  E       X X   U   U  S
N N N  EEEE     X    U   U  SSSS
N  NN  E       X X   U   U     S
N   N  EEEEE  X   X  UUUU   SSSS
```
**An AI-powered Industrial Knowledge Intelligence Platform**

NEXUS bridges the gap between siloed industrial data (P&IDs, SOPs, Work Orders, Regulations, Expert Knowledge) and actionable operational intelligence.

---

## 🌟 Core Features

- **SYNAPSE (Knowledge Graph)**: Ingests documents to automatically extract industrial entities (Assets) and infer their topological and operational relationships.
- **ORACLE (Copilot)**: A hybrid RAG-based query engine using MongoDB Atlas Vector Search and Groq (Llama-3.3-70B). Supports desktop and mobile voice interfaces for field technicians.
- **CHRONICLE (Failure Intelligence)**: Mines historical incident reports and work orders to detect recurring failure patterns. Features an Expert Capture mode to ingest tacit knowledge from retiring engineers.
- **SpectraSync (Compliance Engine)**: Automatically maps internal procedures against external regulatory codes (e.g., OISD, Factory Act) and flags critical compliance gaps using LLMs.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (M0 free tier is sufficient, with Vector Search enabled)
- Groq API Key
- Upstash Redis (or any Redis instance)

### 2. Clone & Install
```bash
git clone https://github.com/jaimin019/NEXUS.git
cd NEXUS

# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `/server` directory:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nexus?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_api_key_here
UPSTASH_REDIS_REST_URL=https://your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
REDIS_URL=rediss://default:password@your-upstash-url:port
```

### 4. Seed Demo Data
Populate the database with a complete, realistic industrial plant scenario (Bharat Refinery Unit-3):
```bash
cd server
node scripts/seedDemoData.js
```

### 5. Run the Application
Run both the backend and frontend simultaneously:
```bash
# In the root or server directory:
npm run dev

# Or run them separately:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```
Navigate to **http://localhost:5173** to access the NEXUS dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, TailwindCSS, shadcn/ui, Zustand, Framer Motion, Lucide React |
| **Backend** | Node.js, Express, Mongoose, Bull (Redis Queues) |
| **AI / NLP** | Groq (Llama-3.3-70B), Xenova Transformers (Local Embeddings) |
| **Database** | MongoDB Atlas (Document Store + Vector Search) |

---

## 🏗️ Architecture
Click the **Architecture** button in the TopBar of the application to view the full three-layer architectural diagram, or navigate to `/architecture`.

---
**Team:** Jaimin Hadvani + Pal Kaneria  
*Built for the ET AI Hackathon 2026* 🏆
