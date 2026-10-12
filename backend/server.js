import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateSoundSpeed, 
  calculateAbsorption, 
  evaluateCandidateFrequencies,
  calculateTransmissionLoss,
  calculateOptimalFrequency,
  calculateSonarEquation,
  calculateAdaptivePower,
  calculateMissionDuration
} from './acousticModel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
 * Complete hydroacoustic, range resolution, and battery endurance engine
 */
app.post('/api/sonar/calculate', (req, res) => {
  try {
    const config = req.body || {};

    const depthM = Number(config.depthM) || 50;
    const turbidityNtu = Number(config.turbidityNtu) || 0;
    const tempC = Number(config.tempC) || 15;
    const salinityPsu = Number(config.salinityPsu) || 35;
    const minFreqKhz = Number(config.minFreqKhz) || 100;
    const maxFreqKhz = Number(config.maxFreqKhz) || 500;
    const targetDistanceM = Number(config.targetDistanceM) || 100;
    const desiredRangeResM = Number(config.desiredRangeResM) || 0.05;
    const chirpBandwidthKhz = Number(config.chirpBandwidthKhz) || 30;
    const pulseDurationMs = Number(config.pulseDurationMs) || 10;
    const transmitPowerLimitW = Number(config.transmitPowerLimitW) || 100;
    const targetStrengthDb = Number(config.targetStrengthDb) || 10;
    const batteryVoltageV = Number(config.batteryVoltageV) || 48;
    const batteryCapacityAh = Number(config.batteryCapacityAh) || 10;
    const usableCapacityPct = Number(config.usableCapacityPct) || 80;
    const desiredMissionHours = Number(config.desiredMissionHours) || 8;
    const amplifierEfficiencyPct = Number(config.amplifierEfficiencyPct) || 82;
    const electronicsPowerW = Number(config.electronicsPowerW) || 12;
    const dutyCyclePct = Number(config.dutyCyclePct) || 10;

    // 1. Environmental sound speed
    const calculatedSoundSpeed = calculateSoundSpeed(tempC, salinityPsu, depthM);
    const effectiveSoundSpeed = (config.soundSpeedManual !== null && !isNaN(config.soundSpeedManual) && config.soundSpeedManual > 1000) 
      ? Number(config.soundSpeedManual) 
      : calculatedSoundSpeed;

    // 2. Frequency Range and Bandwidth
    const minF = Math.max(1, Math.min(minFreqKhz, maxFreqKhz > 1 ? maxFreqKhz - 1 : 1));
    const maxF = Math.max(minF + 1, maxFreqKhz);
    const maxAvailableBandwidth = Math.max(0, maxF - minF);
    const effectiveBandwidthKhz = Math.min(chirpBandwidthKhz, maxAvailableBandwidth);

    // 3. Recommended Frequency
    const rangeFactor = Math.min(1, Math.max(0, (targetDistanceM - 10) / 490));
    const turbFactor = Math.min(1, Math.max(0, turbidityNtu / 100));
    const penalty = 0.60 * rangeFactor + 0.40 * turbFactor;
    const recommendedFreqKhz = Math.round(maxF - penalty * (maxF - minF));

    // 4. Acoustic Absorption
    const calculatedAlpha_dB_m = calculateAbsorption(recommendedFreqKhz, tempC, salinityPsu, depthM, turbidityNtu);
    const calculatedAlpha_dB_km = calculatedAlpha_dB_m * 1000.0;
    const effectiveAlpha_dB_km = (config.attenuationManual !== null && !isNaN(config.attenuationManual) && config.attenuationManual > 0)
      ? Number(config.attenuationManual)
      : calculatedAlpha_dB_km;
    const effectiveAlpha_dB_m = effectiveAlpha_dB_km / 1000.0;

    // 5. Resolution
    const bandwidthHz = effectiveBandwidthKhz * 1000;
    const requiredBandwidthKhz = (effectiveSoundSpeed / (2 * Math.max(0.001, desiredRangeResM))) / 1000;
    const achievableRangeResolutionM = effectiveSoundSpeed / (2 * Math.max(1000, bandwidthHz));

    // 6. Loss & Power
    const r = Math.max(1, targetDistanceM);
    const oneWayTL = 20 * Math.log10(r) + (effectiveAlpha_dB_m * r);
    const twoWayTL = 2 * oneWayTL;

    const ampEfficiency = Math.max(0.1, amplifierEfficiencyPct > 0 ? amplifierEfficiencyPct / 100 : 0.82);
    const tauSec = Math.max(0.001, pulseDurationMs / 1000);
    const processingGain = 10 * Math.log10(Math.max(1, bandwidthHz * tauSec));
    const requiredSL = 20.0 + 45.0 - processingGain + twoWayTL - targetStrengthDb;
    const requiredPAcoustic = Math.pow(10, (requiredSL - 185.8) / 10);
    const requiredTransmitterPowerW = Math.max(1, Math.min(250, requiredPAcoustic / 0.5));
    const activeTransmitPowerW = transmitPowerLimitW > 0 
      ? Math.min(transmitPowerLimitW, requiredTransmitterPowerW) 
      : requiredTransmitterPowerW;

    // 7. Battery & Power
    const usableBatteryEnergyWh = (batteryVoltageV * batteryCapacityAh) * (usableCapacityPct / 100);
    const effectiveDutyCycle = config.transmissionMode === 'Continuous' ? 1.0 : (dutyCyclePct / 100);
    const txElectricalPowerDuringPulseW = activeTransmitPowerW / ampEfficiency;
    const averageTransmitPowerW = txElectricalPowerDuringPulseW * effectiveDutyCycle;
    const totalAverageSystemPowerW = averageTransmitPowerW + electronicsPowerW;
    const estimatedRuntimeHours = totalAverageSystemPowerW > 0 ? (usableBatteryEnergyWh / totalAverageSystemPowerW) : 0;

    // Candidate Frequencies
    const candidates = evaluateCandidateFrequencies(config, effectiveSoundSpeed);

    return res.json({
      success: true,
      results: {
        effectiveSoundSpeed,
        calculatedSoundSpeed,
        recommendedFreqKhz,
        effectiveAlpha_dB_km,
        effectiveAlpha_dB_m,
        achievableRangeResolutionM,
        requiredBandwidthKhz,
        oneWayTL,
        twoWayTL,
        requiredTransmitterPowerW,
        activeTransmitPowerW,
        usableBatteryEnergyWh,
        totalAverageSystemPowerW,
        estimatedRuntimeHours,
        candidateFrequencies: candidates
      }
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sonar/sound-speed
 */
app.post('/api/sonar/sound-speed', (req, res) => {
  const { temperatureC = 15, salinityPsu = 35, depthM = 50 } = req.body;
  const speed = calculateSoundSpeed(temperatureC, salinityPsu, depthM);
  res.json({ success: true, soundSpeedMs: speed });
});

/**
 * POST /api/telemetry/log
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
