# FloodGuard 🌊
### AI-Powered Urban Flood Prediction, Early Warning & Safe Emergency Routing System

> **Hackathon Track:** Track 02 — Heat and Water (Monsoon Urban Flooding & Waterlogging Focus)  
> **Target Environment:** Local & AWS Cloud Hybrid (AWS IoT Core, DynamoDB, Lambda, S3, Amplify)  
> **Status:** Phase 0 Complete — Monorepo & Environment Foundations Initialized

---

## 📌 Executive Summary

**FloodGuard** is an intelligent, dual-mode urban flood forecasting and emergency vehicle navigation platform designed for city disaster management authorities, emergency responders, and citizens.

Traditional flood management systems are passive: they register street submergence only after vehicles are already trapped. FloodGuard combines real-time IoT water telemetry (ESP8266 + HC-SR04 ultrasonic nodes) with an **AI Hydrological Predictive Engine (XGBoost)** to forecast road-level inundation **30 to 60 minutes in advance**. Using dynamic risk scoring and a hydrology-weighted **A\*/Dijkstra router**, FloodGuard actively routes ambulances, fire engines, and rescue personnel around flood danger zones, saving critical response time.

Crucially, FloodGuard operates in **Dual-Mode (Real Hardware + Autonomous Hydrological Simulator)**, guaranteeing zero-downtime, fail-safe presentations under any network conditions.

---

## 🏛️ System Architecture

```
                                  +------------------------------------+
                                  |   ESP8266 + HC-SR04 Hardware Node  |
                                  +-----------------+------------------+
                                                    | (MQTT / REST)
                                                    v
+-------------------------------+         +-------------------+
|  Synthetic Weather Simulator  | ------> |  AWS IoT Core /   |
| (Flash Flood / Monsoon Storm) |         | FastAPI Ingestion |
+-------------------------------+         +---------+---------+
                                                    |
                                                    v
                                      +---------------------------+
                                      |    Amazon DynamoDB        |
                                      | (or In-Memory Local Store)|
                                      +-------------+-------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
          +-------------------------------+                     +-------------------------------+
          |      XGBoost ML Forecaster    |                     |      Flood Risk Engine        |
          |  (30m / 60m Depth Prediction) |                     | (LOW, MODERATE, HIGH, CRITICAL)|
          +---------------+---------------+                     +---------------+---------------+
                          |                                                     |
                          +-------------------------+---------------------------+
                                                    |
                                                    v
                                      +---------------------------+
                                      |     A* Safe Router        |
                                      | (Flood-Penalty Graph Nav) |
                                      +-------------+-------------+
                                                    |
                                                    v
                                      +---------------------------+
                                      | Command Center Dashboard  |
                                      | (React + Leaflet + Vite)  |
                                      +---------------------------+
```

---

## 🗂️ Monorepo Directory Structure

```
Floodguard/
├── backend/                  # FastAPI Application & ML Integration
│   ├── app/
│   │   ├── api/v1/           # API routes (sensors, zones, predictions, routing, alerts, simulation)
│   │   ├── core/             # Flood risk scoring, A* router, synthetic storm simulator
│   │   ├── db/               # DynamoDB client & high-speed in-memory fallback
│   │   ├── ml/               # XGBoost model loader, pipeline & artifacts (.joblib)
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── config.py         # Pydantic Settings configuration loader
│   │   └── main.py           # FastAPI entrypoint, CORS & middleware
│   ├── data/                 # Road topology graphs & synthetic flood datasets
│   ├── scripts/              # Cloud initialization & migration utilities
│   ├── venv/                 # Python 3.10+ virtual environment
│   ├── requirements.txt      # Pinned Python dependencies
│   └── .env.example          # Backend environment variables template
│
├── frontend/                 # React 18 + Vite WebGIS Command Center
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Header, command bar, simulation controls
│   │   │   ├── map/          # Leaflet map, flood zones, sensor pins, route layers
│   │   │   ├── metrics/      # KPI stat cards, water depth trend charts (Recharts)
│   │   │   ├── routing/      # Origin/destination selectors & safe route summary
│   │   │   ├── alerts/       # Real-time alert drawer & urgent warnings
│   │   │   └── explainability/ # Feature importance / SHAP factor charts
│   │   ├── services/         # Axios API client & offline mock data fallbacks
│   │   ├── App.jsx           # Main 3-column command center orchestration
│   │   └── index.css         # Dark-mode command palette styling
│   ├── package.json          # Node dependencies (Leaflet, Recharts, Lucide, Axios)
│   └── .env.example          # Frontend environment variables template
│
├── iot/                      # IoT Edge Device Firmware
│   └── esp8266/              # ESP8266 NodeMCU + HC-SR04 ultrasonic sensor sketch
│
├── ml/                       # Machine Learning Engineering & Training
│   ├── notebooks/            # Exploratory data analysis & model experiments
│   ├── datasets/             # Hydrology dataset generator scripts
│   └── train.py              # XGBoost training script with dual-horizon outputs
│
├── docs/                     # Architectural documentation, schemas, and diagrams
├── implementation_plan.md    # Master technical implementation roadmap
└── phase_wise_work.md        # 4-Day phase checklist & task breakdown
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.11)
- **Node.js 18+** & **npm**
- **Git**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies (already pinned in requirements.txt)
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Create environment configuration
cp .env.example .env

# Start Vite React development server
npm run dev
```
- Command Center UI: [http://localhost:5173](http://localhost:5173)

---

## 👥 4-Member Team Domain Allocation

| Member | Workstream | Primary Responsibilities |
|---|---|---|
| **Member 1** | **ML / Hydrology Engineer** | Synthetic data generation, XGBoost 30m/60m training, pipeline serialization, SHAP explainability. |
| **Member 2** | **Backend / AWS Cloud Lead** | FastAPI service, DynamoDB persistence, AWS IoT Core bridge, failover handling. |
| **Member 3** | **Frontend / WebGIS Lead** | Vite React command dashboard, Leaflet GeoJSON layer renderer, Recharts visual analytics. |
| **Member 4** | **IoT Hardware & Routing Lead** | ESP8266 ultrasonic firmware, A* flood-weighted graph router, simulation suite, end-to-end QA. |

---

## 🛡️ License & Acknowledgements
Built for the **Track 02 — Heat and Water Hackathon**. Powered by AWS Open Source & Cloud Services.
