# LARS — Laboratory Analysis and Risk System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini Live API](https://img.shields.io/badge/Google%20Gemini%20Live%20API-8E75B2?style=flat&logo=google&logoColor=white)](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?style=flat&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**LARS** (Laboratory Analysis and Risk System) is a deterministic lab query engine 
with a voice interface and LLM-based language understanding, built for food 
safety laboratories in Saudi Arabia. Chemists and lab managers speak naturally — 
LARS interprets intent, translates it into a constrained query plan, executes 
deterministic queries against verified laboratory data, and speaks the answer back.

> 🎙️ "How many tomato samples were tested in 2023?"  
> 🧠 LARS interprets intent → builds constrained query → executes against GC-MS/MS data  
> 🤖 Speaks the verified answer with source, filters applied, and record count.

### [🚀 Try the Live Demo](https://lars-backend-863449087382.us-central1.run.app)

---

<div align="center">
  <img src="assets/screenshot1.png" alt="LARS Voice Interface" width="30%">
  <img src="assets/screenshot2.png" alt="LARS Query Results" width="30%">
  <img src="assets/screenshot3.png" alt="LARS Dashboard" width="30%">
</div>

> 📸 *Add your screenshots to the `assets/` folder and update the filenames above.*

---

## What LARS Can Do

- **Sample counts** — by vegetable, pesticide, year, or location
- **Violations** — non-compliant samples and exceedance ratios
- **Pesticide search** — Bifenthrin, Pyridaben, Chlorpyrifos, and more
- **Commodity search** — Tomato, Cucumber, Pepper, and more
- **Risk assessment** — health risk scoring for specific pesticides
- **Trend analysis** — year-over-year compliance comparisons
- **Statistical summaries** — ANOVA, seasonal patterns, top violators

---

## Architecture

```
User Voice
    │
    ▼
LARS (Cloud Run — public)
  FastAPI + WebSocket
  Gemini Live API (voice ↔ audio)
    │
    ▼ REST API
LARS Engine (Cloud Run — private)
  CoreQueryEngine
    │
    ▼
DuckDB (pesticide residue data)
```

- **LARS frontend+backend** handles voice interface, WebSocket audio streaming, and Gemini Live session management.
- **LARS Engine** is a private microservice that processes natural language queries against the laboratory database.
- **Gemini Live** provides real-time bidirectional audio with sub-second latency.

**Query pipeline:**
1. Gemini Live API interprets the spoken question and extracts intent + entities
2. LARS Engine translates into a constrained, validated query plan
3. Backend executes deterministic SQL against DuckDB (no LLM touches the data)
4. Response includes the answer, filters applied, and matched record count

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript, Vite, Web Audio API, WebSockets |
| Backend | Python, FastAPI, Uvicorn |
| AI | Google Gemini Live API (`gemini-2.0-flash-live-001`) |
| Database | DuckDB |
| Deployment | Google Cloud Run (Vertex AI) |
| Auth | Google ADC (Application Default Credentials) |

---

## Prerequisites

- Node.js v18+
- Python 3.10+
- Google Cloud Project with Vertex AI API enabled
- Google Cloud Application Default Credentials configured

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/sadek1984/LabSense.git
cd LabSense
```

### 2. Install dependencies

```bash
# Python
pip install -r requirements.txt

# Frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PROJECT_ID=your-gcp-project-id
LOCATION=us-central1
MODEL=gemini-2.0-flash-live-001
DEV_MODE=true
SESSION_TIME_LIMIT=180
LARS_ENGINE_URL=http://localhost:8100
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
DEV_MODE=true uvicorn server.main:app --host 0.0.0.0 --port 8080 --reload

# Terminal 2 — Frontend
npm run dev
```

Access at `http://localhost:5173`

---

## Production Deployment (Google Cloud Run)

### Deploy LARS (frontend + backend)

```bash
gcloud run deploy lars-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=your-project-id \
  --set-env-vars LOCATION=us-central1 \
  --set-env-vars MODEL=gemini-2.0-flash-live-001 \
  --set-env-vars DEV_MODE=true \
  --set-env-vars SESSION_TIME_LIMIT=180 \
  --set-env-vars LARS_ENGINE_URL=https://your-lars-engine-url
```

### Deploy LARS Engine (private microservice)

The LARS engine is a separate private service. Deploy from your LARS engine directory:

```bash
gcloud run deploy lars-engine \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars LARS_DUCKDB_PATH=/app/src/LARS/data/lars_data.duckdb
```

> **Note:** The LARS engine source code and database are private and not included in this repository. The frontend connects to it via REST API.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PROJECT_ID` | Google Cloud Project ID | auto-detected |
| `LOCATION` | Vertex AI region | `us-central1` |
| `MODEL` | Gemini Live model name | `gemini-2.0-flash-live-001` |
| `DEV_MODE` | Disable rate limiting & reCAPTCHA | `false` |
| `SESSION_TIME_LIMIT` | Max session duration (seconds) | `180` |
| `LARS_ENGINE_URL` | URL of the LARS engine microservice | required |
| `REDIS_URL` | Redis URL for rate limiting (production) | optional |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key (production) | optional |

---

## Example Voice Queries

Once connected, speak naturally:

```
"How many samples were tested in 2024?"
"Show me all Bifenthrin violations"
"What is the compliance rate for cucumbers?"
"Which neighborhood has the most violations?"
"Compare violation rates between 2022 and 2023"
"What are the top 5 most violated pesticides?"
"Assess the health risk for Pyridaben in peppers"
```

---

## Acknowledgements

Built on top of [Immersive Language Learning with Live API](https://github.com/ZackAkil/immersive-language-learning-with-live-api) by Google LLC, licensed under Apache 2.0.

---

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

## Testing

1. Open the live demo: https://lars-backend-863449087382.us-central1.run.app
2. Click **Start Session** and allow microphone access
3. Ask any of these questions out loud:
   - "How many samples were tested in 2024?"
   - "Show me Bifenthrin violations"
   - "What is the compliance rate for tomatoes?"
4. LARS will respond with voice and transcript

## Evaluation

- Average response latency: < 3 seconds  
- Bilingual support: Arabic and English tested
- Query types supported: 10+ intent patterns
- Data: Real GC-MS/MS and LC-MS/MS lab results
- Deployment: Live on Google Cloud Run