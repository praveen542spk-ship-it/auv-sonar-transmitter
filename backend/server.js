import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateSoundSpeed, 
  calculateAbsorption, 
  calculateTransmissionLoss, 
  calculateSNR, 
  runAdaptiveSonarOptimization 
} from './acousticModel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://abcaveuzsenckhislsjf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X-YuDA1KPq0TLYCeCKl6KQ_o3CJIoDH';
const supabase = createClient(supabaseUrl, supabaseKey);

// Root Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AUV Adaptive SDR Sonar Backend API',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/sonar/calculate
 * Runs comprehensive hydroacoustic calculations (Mackenzie, Francois-Garrison, SNR, Power & Battery)
 */
app.post('/api/sonar/calculate', (req, res) => {
  try {
    const config = req.body;
    const results = runAdaptiveSonarOptimization(config);
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sonar/sound-speed
 * Calculates Mackenzie Sound Speed (m/s)
 */
app.post('/api/sonar/sound-speed', (req, res) => {
  const { temperatureC = 15, salinityPsu = 35, depthM = 50 } = req.body;
  const speed = calculateSoundSpeed(temperatureC, salinityPsu, depthM);
  res.json({ success: true, soundSpeedMs: speed });
});

/**
 * POST /api/telemetry/log
 * Stores mission telemetry or operator login into Supabase
 */
app.post('/api/telemetry/log', async (req, res) => {
  try {
    const { operator_name, email, role, login_time } = req.body;
    const { data, error } = await supabase.from('operator_logins').insert([
      { operator_name, email, role, login_time: login_time || new Date().toISOString() }
    ]);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.json({ success: true, message: 'Logged to Supabase', data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[AUV SONAR BACKEND] Server running on port ${PORT}`);
  console.log(`[HEALTH CHECK] http://localhost:${PORT}/api/health`);
});
