# AUV SDR Sonar Transmitter - Backend API

Node.js / Express Backend Server providing acoustic simulation calculations, environmental models, and Supabase telemetry logging for the AUV Sonar Dashboard.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
```bash
# Production mode
npm start

# Development mode (auto-reload on save)
npm run dev
```

The API will start at: `http://localhost:5000`

---

## 📡 API Endpoints

### Health Check
- **`GET /api/health`**
- Returns server status, version, and current UTC timestamp.

### Acoustic Calculations
- **`POST /api/sonar/calculate`**
  - **Body**: Complete mission parameters (`depthM`, `temperatureC`, `salinityPsu`, `targetDistanceM`, `desiredRangeResM`, `batteryCapacityMah`, `batteryVoltageV`, etc.)
  - **Response**: Full hydroacoustic results (Mackenzie sound speed, absorption alpha, optimal frequency, power scaling, battery endurance, Class D amplifier efficiency).

- **`POST /api/sonar/sound-speed`**
  - **Body**: `{ "temperatureC": 15, "salinityPsu": 35, "depthM": 50 }`
  - **Response**: Sound speed in m/s using Mackenzie formula.

### Telemetry & Logins
- **`POST /api/telemetry/log`**
  - **Body**: `{ "operator_name": "...", "email": "...", "role": "..." }`
  - Records session directly to Supabase cloud database.
