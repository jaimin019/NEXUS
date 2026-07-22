# NEXUS — Industrial Knowledge Intelligence Platform

> AI for Industrial Knowledge Intelligence: Unified Asset & Operations Brain  
> ET AI Hackathon 2026 — Problem Statement 8

NEXUS is an AI-powered Operations Brain engineered to eliminate the critical information fragmentation bottleneck plaguing modern industrial plants. Today, industrial professionals spend **35% of their time searching for information across 7–12 disconnected document systems**—including siloed SOPs, complex P&IDs, historical maintenance logs, active work orders, and strict regulatory frameworks—while mission-critical operational wisdom disappears every time an experienced engineer retires. NEXUS unifies these disparate data streams into a dynamic, cross-linked institutional brain, enabling real-time multi-hop knowledge discovery, predictive failure intelligence, and automated compliance auditing across the entire asset lifecycle.

## Key Features
- **SYNAPSE (Autonomous Knowledge Graph Engine)**: Automatically ingests unstructured industrial documents to extract equipment tags and build a topological asset network with auditable relationship edges, leveraging entity extraction pipelines to link equipment nodes across SOPs, P&IDs, and maintenance logs.
- **ORACLE (Hybrid RAG Copilot & Tacit Knowledge Copilot)**: Synthesizes multi-document operational answers with exact source citations and real-time active work order safety checks, powered by Reciprocal Rank Fusion (RRF) combining 384-dimensional vector search with keyword filtering over local and tacit engineer knowledge.
- **CHRONICLE (Predictive Failure Intelligence & Expert Capture)**: Mines historical failure signatures and captures retiring engineers' undocumented operational wisdom via interactive interviews, utilizing a real-time vector similarity simulator to match field symptoms against historical breakdown trajectories.
- **SpectraSync (Autonomous Regulatory Compliance Engine)**: Continuously audits internal SOPs and maintenance procedures against OISD, Factory Act, and PESO standards, detecting critical safety gaps and automatically drafting corrective, audit-ready regulatory amendments.

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React + Vite + TailwindCSS + D3.js |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas (M0 free tier) |
| **Vector Search** | MongoDB Atlas Vector Search (384-dim) |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 (local, no API cost) |
| **LLM** | Groq API — Llama 3.3 70B |
| **Queue** | Bull + Upstash Redis |
| **Auth** | JWT (bcrypt) |

## Architecture
Explore the full system design by visiting the `/architecture` route within the live application or viewing our interactive architectural breakdown. The NEXUS platform is organized into a robust **3-Layer Architecture** comprising an Ingestion & Data Layer, an AI & Intelligence Layer, and a Presentation & Experience Layer. Unstructured industrial documents and tacit interviews pass through an asynchronous 4-stage ingestion pipeline (`Parsing` → `Entity Extraction` → `Embedding` → `Graph Construction`) queued via Redis and stored in MongoDB Atlas. The four autonomous agents (`SYNAPSE`, `ORACLE`, `CHRONICLE`, and `SpectraSync`) orchestrate local embeddings and Llama 3.3 70B inference to deliver instant, verifiable knowledge to field technicians and plant operators.

## Quick Start
Execute the following commands on a fresh machine to clone the repository, install dependencies, seed the demo database, and launch the platform:

```bash
# 1. Clone the repository and enter the directory
git clone https://github.com/jaimin019/NEXUS.git
cd NEXUS

# 2. Install all platform dependencies (root, client, and server)
npm run install:all

# 3. Configure backend environment variables
cd server
cp .env.example .env
# Edit .env with your MongoDB Atlas, Groq API Key, Upstash Redis, and JWT credentials

# 4. Seed the demo database with Bharat Refinery Unit-3 industrial assets and documents
npm run seed

# 5. Create MongoDB Atlas Vector Search index
npm run create-indexes

# 6. Launch both backend server and frontend development server simultaneously
cd ..
npm run dev
```
Navigate to **http://localhost:5173** and sign in using `demo@nexus.ai` / `nexus2026`.

## Team
- **Jaimin Hadvani** — [GitHub](https://github.com/jaimin019) | [LinkedIn](https://www.linkedin.com/in/jaimin-hadvani-6a1496284/)
- **Pal Kaneria** — [GitHub](https://github.com/palkaneria) | [LinkedIn](www.linkedin.com/in/pal-kaneria-49517232b)

## Submission
**ET AI Hackathon 2026 | Problem Statement 8**
