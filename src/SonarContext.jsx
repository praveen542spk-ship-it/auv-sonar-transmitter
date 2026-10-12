import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  calculateSoundSpeed, 
  calculateAbsorption, 
  evaluateCandidateFrequencies,
  calculateContinuousAdaptation,
  generateDetailedLFMChirp,
  simulateOceanStep,
  playAcousticPingSound,
  generateIqWavBlob
} from './acousticModel';
import { supabase } from './supabaseClient';

export const SonarContext = createContext();

// Operational Default Configuration (Ready for instant live adaptation)
export const DEFAULT_CONFIG = {
  // 1. Environmental Inputs (Outside Environment)
  depthM: 45,
  turbidityNtu: 18,
  tempC: 16,
  salinityPsu: 35,
  soundSpeedManual: null,
  attenuationManual: null,

  // 2. Sonar Configuration
  minFreqKhz: 100,
  maxFreqKhz: 500,
  targetDistanceM: 110,
  desiredRangeResM: 0.05,
  chirpBandwidthKhz: 35,
  pulseDurationMs: 15,
  transmissionMode: 'Pulsed',
  transmitPowerLimitW: 100,
  targetStrengthDb: -10,
  receiverSensitivityDb: -90,

  // 3. Battery and Power Inputs
  batteryVoltageV: 48,
  batteryCapacityAh: 10,
  usableCapacityPct: 88, // 88% default depth of discharge / state of charge
  desiredMissionHours: 8,
  amplifierEfficiencyPct: 82,
  electronicsPowerW: 12,
  dutyCyclePct: 15 // 15% duty cycle nominal
};

// Zero-config retained for backwards-compatibility or explicit zero reset
export const ZERO_CONFIG = {
  depthM: 0,
  turbidityNtu: 0,
  tempC: 0,
  salinityPsu: 0,
  soundSpeedManual: null,
  attenuationManual: null,
  minFreqKhz: 0,
  maxFreqKhz: 0,
  targetDistanceM: 0,
  desiredRangeResM: 0,
  chirpBandwidthKhz: 0,
  pulseDurationMs: 0,
  transmissionMode: 'Pulsed',
  transmitPowerLimitW: 0,
  targetStrengthDb: 0,
  receiverSensitivityDb: 0,
  batteryVoltageV: 0,
  batteryCapacityAh: 0,
  usableCapacityPct: 0,
  desiredMissionHours: 0,
  amplifierEfficiencyPct: 0,
  electronicsPowerW: 0,
  dutyCyclePct: 0
};

export const ZERO_RESULTS = {
  hasCalculated: false,
  isOutdated: false,
  effectiveSoundSpeed: 0,
  calculatedSoundSpeed: 0,
  minF: 0,
  maxF: 0,
  maxAvailableBandwidth: 0,
  effectiveBandwidthKhz: 0,
  recommendedFreqKhz: 0,
  effectiveAlpha_dB_km: 0,
  effectiveAlpha_dB_m: 0,
  calculatedAlpha_dB_km: 0,
  requiredBandwidthKhz: 0,
  achievableRangeResolutionM: 0,
  satisfiesResolution: false,
  oneWayTL: 0,
  twoWayTL: 0,
  processingGain: 0,
  requiredSL: 0,
  requiredTransmitterPowerW: 0,
  isPowerWithinLimit: false,
  activeTransmitPowerW: 0,
  nominalBatteryEnergyWh: 0,
  usableBatteryEnergyWh: 0,
  effectiveDutyCycle: 0,
  txElectricalPowerDuringPulseW: 0,
  averageTransmitPowerW: 0,
  amplifierLossesW: 0,
  electronicsPowerW: 0,
  totalAverageSystemPowerW: 0,
  estimatedRuntimeHours: 0,
  energyConsumedPerHourWh: 0,
  estimatedMissionEnergyWh: 0,
  remainingBatteryEnergyWh: 0,
  meetsMissionDuration: false,
  baselineAvgPowerW: 0,
  baselineRuntimeHours: 0,
  baselineMissionEnergyWh: 0,
  powerSavingPct: 0,
  energySavingPct: 0,
  candidateFrequencies: [],
  feasibilityStatus: 'Not calculated',
  feasibilityExplanation: 'Enter environmental and sonar parameters above and click Calculate to run the simulation.',
  calculationTimestamp: 0
};

export function SonarProvider({ children }) {
  // 1. Core Sonar Configuration
  const [config, setConfig] = useState(() => {
    try {
      const saved = sessionStorage.getItem('auv_sonar_config_v4');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read sessionStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  const [hasCalculated, setHasCalculated] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTimestamp, setCalculationTimestamp] = useState(() => Date.now());

  // Real-time battery depletion tracking (Wh)
  const initialUsableWh = (DEFAULT_CONFIG.batteryVoltageV * DEFAULT_CONFIG.batteryCapacityAh * DEFAULT_CONFIG.usableCapacityPct) / 100;
  const [realtimeBatteryWh, setRealtimeBatteryWh] = useState(initialUsableWh);

  // 2. Real-Time Live Environmental Streaming States & Mode Selection
  // inputMode: 'continuous' (live changing ocean inputs) | 'manual_constant' (user enters constant inputs)
  const [inputMode, setInputMode] = useState('continuous');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [streamScenario, setStreamScenario] = useState('random_drift'); // 'random_drift' | 'approaching_target' | 'turbidity_spike' | 'thermocline_dive' | 'manual'
  const [streamRateMs, setStreamRateMs] = useState(350); // 350ms interval between live pings
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  // 3. Circular Buffers for Real-Time Telemetry & Spectrogram Waterfall
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [waterfallHistory, setWaterfallHistory] = useState([]);

  // Ref to hold current config and latest calculation results for stream loop without stale closure
  const configRef = useRef(config);
  configRef.current = config;
  const tickRef = useRef(0);
  const resultsRef = useRef(null);

  // Save config to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('auv_sonar_config_v4', JSON.stringify(config));
    } catch (e) {}
  }, [config]);

  // Update specific input field (instant calculation, keeps isOutdated false)
  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setCalculationTimestamp(Date.now());
    setIsOutdated(false);
  }, []);

  const updateMultipleConfig = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setCalculationTimestamp(Date.now());
    setIsOutdated(false);
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    const defUsable = (DEFAULT_CONFIG.batteryVoltageV * DEFAULT_CONFIG.batteryCapacityAh * DEFAULT_CONFIG.usableCapacityPct) / 100;
    setRealtimeBatteryWh(defUsable);
    setHasCalculated(true);
    setIsOutdated(false);
    setCalculationTimestamp(Date.now());
    try {
      sessionStorage.setItem('auv_sonar_config_v4', JSON.stringify(DEFAULT_CONFIG));
    } catch (e) {}
  }, []);

  const resetBatteryCapacity = useCallback(() => {
    const usable = (config.batteryVoltageV * config.batteryCapacityAh * config.usableCapacityPct) / 100;
    setRealtimeBatteryWh(usable);
  }, [config.batteryVoltageV, config.batteryCapacityAh, config.usableCapacityPct]);

  const triggerCalculate = useCallback(async () => {
    setIsCalculating(true);
    setTimeout(async () => {
      setCalculationTimestamp(Date.now());
      setHasCalculated(true);
      setIsOutdated(false);
      setIsCalculating(false);

      try {
        await supabase.from('sonar_simulations').insert([
          {
            target_distance_m: config.targetDistanceM,
            water_depth_m: config.depthM,
            turbidity_ntu: config.turbidityNtu,
            water_temp_c: config.tempC,
            salinity_psu: config.salinityPsu,
            min_freq_khz: config.minFreqKhz,
            max_freq_khz: config.maxFreqKhz,
            battery_voltage_v: config.batteryVoltageV,
            battery_capacity_ah: config.batteryCapacityAh,
            duty_cycle_pct: config.dutyCyclePct,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (err) {}
    }, 150);
  }, [config]);

  // Toggle Live Streaming ON / OFF and synchronize with inputMode
  const toggleLiveStreaming = useCallback(() => {
    setIsLiveStreaming(prev => {
      const next = !prev;
      setInputMode(next ? 'continuous' : 'manual_constant');
      return next;
    });
  }, []);

  const setModeContinuous = useCallback(() => {
    setInputMode('continuous');
    setIsLiveStreaming(true);
  }, []);

  const setModeManualConstant = useCallback(() => {
    setInputMode('manual_constant');
    setIsLiveStreaming(false);
  }, []);

  const toggleInputMode = useCallback(() => {
    setInputMode(prev => {
      const next = prev === 'continuous' ? 'manual_constant' : 'continuous';
      setIsLiveStreaming(next === 'continuous');
      return next;
    });
  }, []);

  // Toggle Audio Chirp Pings
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  // Quick Disturbance Injection (For Demonstrating Real-Time Adaptation)
  const injectDisturbance = useCallback((type) => {
    switch (type) {
      case 'turbidity_spike':
        updateConfig('turbidityNtu', 85);
        break;
      case 'obstacle_close':
        updateConfig('targetDistanceM', 22);
        break;
      case 'deep_target':
        updateConfig('targetDistanceM', 280);
        break;
      case 'thermocline_drop':
        updateMultipleConfig({ depthM: 160, tempC: 5.5 });
        break;
      default:
        break;
    }
  }, [updateConfig, updateMultipleConfig]);

  // 4. Master Calculations Engine (Runs INSTANTLY on any config change or stream tick)
  const results = useMemo(() => {
    const depthM = Number(config.depthM) || 0;
    const turbidityNtu = Number(config.turbidityNtu) || 0;
    const tempC = Number(config.tempC) || 0;
    const salinityPsu = Number(config.salinityPsu) || 0;
    const minFreqKhz = Number(config.minFreqKhz) || 100;
    const maxFreqKhz = Number(config.maxFreqKhz) || 500;
    const targetDistanceM = Number(config.targetDistanceM) || 100;
    const desiredRangeResM = Number(config.desiredRangeResM) || 0.05;
    const chirpBandwidthKhz = Number(config.chirpBandwidthKhz) || 30;
    const pulseDurationMs = Number(config.pulseDurationMs) || 15;
    const transmitPowerLimitW = Number(config.transmitPowerLimitW) || 100;
    const targetStrengthDb = Number(config.targetStrengthDb) !== undefined ? Number(config.targetStrengthDb) : -10;
    const batteryVoltageV = Number(config.batteryVoltageV) || 48;
    const batteryCapacityAh = Number(config.batteryCapacityAh) || 10;
    const usableCapacityPct = Number(config.usableCapacityPct) || 88;
    const desiredMissionHours = Number(config.desiredMissionHours) || 8;
    const amplifierEfficiencyPct = Number(config.amplifierEfficiencyPct) || 82;
    const electronicsPowerW = Number(config.electronicsPowerW) || 12;
    const dutyCyclePct = Number(config.dutyCyclePct) || 15;

    // Use full continuous adaptation engine
    const adaptation = calculateContinuousAdaptation(
      { depthM, tempC, salinityPsu, turbidityNtu, targetDistanceM },
      { minFreqKhz, maxFreqKhz, chirpBandwidthKhz, pulseDurationMs, transmitPowerLimitW, targetStrengthDb },
      { batteryVoltageV, batteryCapacityAh, usableCapacityPct, amplifierEfficiencyPct, electronicsPowerW, dutyCyclePct }
    );

    const calculatedSoundSpeed = calculateSoundSpeed(tempC, salinityPsu, depthM);
    const effectiveSoundSpeed = (config.soundSpeedManual !== null && !isNaN(config.soundSpeedManual) && config.soundSpeedManual > 1000) 
      ? Number(config.soundSpeedManual) 
      : calculatedSoundSpeed;

    const minF = Math.max(1, Math.min(minFreqKhz, maxFreqKhz > 1 ? maxFreqKhz - 1 : 1));
    const maxF = Math.max(minF + 1, maxFreqKhz);
    const maxAvailableBandwidth = Math.max(0, maxF - minF);
    const effectiveBandwidthKhz = Math.min(chirpBandwidthKhz, maxAvailableBandwidth);

    const recommendedFreqKhz = adaptation.adaptedCenterFreqKhz;
    const effectiveAlpha_dB_km = adaptation.alpha_dB_km;
    const effectiveAlpha_dB_m = adaptation.alpha_dB_m;
    const calculatedAlpha_dB_km = effectiveAlpha_dB_km;

    const achievableRangeResolutionM = adaptation.rangeResolutionCm / 100;
    const requiredBandwidthKhz = (effectiveSoundSpeed / (2 * Math.max(0.001, desiredRangeResM))) / 1000;
    const satisfiesResolution = desiredRangeResM > 0 && achievableRangeResolutionM <= desiredRangeResM * 1.05;

    const oneWayTL = adaptation.oneWayTL;
    const twoWayTL = adaptation.twoWayTL;
    const processingGain = adaptation.processingGain;
    const requiredSL = adaptation.actualSL;
    const requiredTransmitterPowerW = adaptation.rawRequiredPowerW;
    const activeTransmitPowerW = adaptation.adaptedTransmitPowerW;
    const isPowerClamped = adaptation.isPowerClamped;

    const nominalBatteryEnergyWh = batteryVoltageV * batteryCapacityAh;
    const usableBatteryEnergyWh = adaptation.usableBatteryWh;
    const effectiveDutyCycle = config.transmissionMode === 'Continuous' ? 1.0 : (dutyCyclePct / 100);
    const ampEfficiency = amplifierEfficiencyPct / 100;
    const txElectricalPowerDuringPulseW = activeTransmitPowerW / ampEfficiency;
    const averageTransmitPowerW = txElectricalPowerDuringPulseW * effectiveDutyCycle;
    const amplifierLossesW = (txElectricalPowerDuringPulseW - activeTransmitPowerW) * effectiveDutyCycle;
    const totalAverageSystemPowerW = adaptation.avgSystemPowerW;

    // Dynamic runtime based on current live remaining battery Wh and total system draw
    const currentBatWh = Math.max(1, realtimeBatteryWh);
    const liveRemainingHours = totalAverageSystemPowerW > 0 
      ? Number((currentBatWh / totalAverageSystemPowerW).toFixed(1)) 
      : 0;
    const liveSOCPct = Number(((currentBatWh / Math.max(1, nominalBatteryEnergyWh)) * 100).toFixed(1));

    const estimatedRuntimeHours = liveRemainingHours;
    const baselineRuntimeHours = adaptation.baselineAvgSystemPowerW > 0
      ? Number((currentBatWh / adaptation.baselineAvgSystemPowerW).toFixed(1))
      : adaptation.baselineRuntimeHours;
    const baselineAvgPowerW = adaptation.baselineAvgSystemPowerW;
    const powerSavingPct = adaptation.powerSavingPct;
    const energySavingPct = powerSavingPct;
    const meetsMissionDuration = desiredMissionHours > 0 && estimatedRuntimeHours >= desiredMissionHours;

    let feasibilityStatus = 'Optimal Adaptive Operation';
    let feasibilityExplanation = `Locked to ${recommendedFreqKhz} kHz carrier at ${activeTransmitPowerW}W transmit power for 20 dB SNR lock.`;

    if (adaptation.isPowerClamped && !meetsMissionDuration) {
      feasibilityStatus = 'Power limit clamped & battery below target';
      feasibilityExplanation = `Required power (${requiredTransmitterPowerW}W) exceeds hardware limit (${transmitPowerLimitW}W). Runtime ${estimatedRuntimeHours}h is below ${desiredMissionHours}h mission.`;
    } else if (adaptation.isPowerClamped) {
      feasibilityStatus = 'Acoustic attenuation high - Power clamped';
      feasibilityExplanation = `Transmit power capped at hardware ceiling (${transmitPowerLimitW}W). Achieved SNR is ${adaptation.achievedSNR} dB.`;
    } else if (!meetsMissionDuration) {
      feasibilityStatus = 'Battery endurance warning';
      feasibilityExplanation = `Estimated endurance ${estimatedRuntimeHours}h is below the desired ${desiredMissionHours}h mission duration.`;
    }

    const candidateFrequencies = evaluateCandidateFrequencies(config, effectiveSoundSpeed);

    const calculatedObj = {
      hasCalculated: true,
      isOutdated: false,
      candidateFrequencies,
      effectiveSoundSpeed,
      calculatedSoundSpeed,
      minF,
      maxF,
      maxAvailableBandwidth,
      effectiveBandwidthKhz,
      recommendedFreqKhz,
      fStartKhz: adaptation.fStartKhz,
      fStopKhz: adaptation.fStopKhz,
      sweepRateKhzMs: adaptation.sweepRateKhzMs,
      timeBandwidthProduct: adaptation.timeBandwidthProduct,
      effectiveAlpha_dB_km,
      effectiveAlpha_dB_m,
      calculatedAlpha_dB_km,
      requiredBandwidthKhz,
      achievableRangeResolutionM,
      rangeResolutionCm: adaptation.rangeResolutionCm,
      roundTripDelayMs: adaptation.roundTripDelayMs,
      satisfiesResolution,
      oneWayTL,
      twoWayTL,
      processingGain,
      requiredSL,
      requiredTransmitterPowerW,
      isPowerWithinLimit: !isPowerClamped,
      activeTransmitPowerW,
      nominalBatteryEnergyWh,
      usableBatteryEnergyWh,
      realtimeBatteryWh: currentBatWh,
      liveSOCPct,
      effectiveDutyCycle,
      txElectricalPowerDuringPulseW,
      averageTransmitPowerW,
      amplifierLossesW,
      electronicsPowerW,
      totalAverageSystemPowerW,
      estimatedRuntimeHours,
      energyConsumedPerHourWh: totalAverageSystemPowerW,
      estimatedMissionEnergyWh: totalAverageSystemPowerW * desiredMissionHours,
      remainingBatteryEnergyWh: Math.max(0, currentBatWh - (totalAverageSystemPowerW * desiredMissionHours)),
      meetsMissionDuration,
      baselineAvgPowerW,
      baselineRuntimeHours,
      baselineMissionEnergyWh: baselineAvgPowerW * desiredMissionHours,
      powerSavingPct,
      energySavingPct,
      achievedSNR: adaptation.achievedSNR,
      ambientNoiseNL: adaptation.ambientNoiseNL,
      feasibilityStatus,
      feasibilityExplanation,
      calculationTimestamp
    };

    resultsRef.current = calculatedObj;
    return calculatedObj;
  }, [config, calculationTimestamp, realtimeBatteryWh]);

  // 5. Detailed LFM Chirp Signal & Echo Matched Filter (Synthesized Live)
  const lfmSignal = useMemo(() => {
    return generateDetailedLFMChirp({
      fStartKhz: results.fStartKhz || 180,
      fStopKhz: results.fStopKhz || 215,
      durationMs: config.pulseDurationMs || 15,
      snrDb: results.achievedSNR || 20,
      pointsCount: 180,
      windowType: 'tukey'
    });
  }, [results.fStartKhz, results.fStopKhz, config.pulseDurationMs, results.achievedSNR]);

  // 6. Play Audible Acoustic Ping
  const playCurrentChirp = useCallback(() => {
    playAcousticPingSound(results.fStartKhz, results.fStopKhz, config.pulseDurationMs);
  }, [results.fStartKhz, results.fStopKhz, config.pulseDurationMs]);

  // 7. Export I/Q Samples as WAV Blob for Hardware SDR
  const exportIqWav = useCallback(() => {
    if (!lfmSignal?.iqSamples?.length) return;
    const url = generateIqWavBlob(lfmSignal.iqSamples, 48000);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDR_AUV_LFM_Chirp_${results.recommendedFreqKhz}kHz_${results.activeTransmitPowerW}W.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [lfmSignal, results.recommendedFreqKhz, results.activeTransmitPowerW]);

  // 8. Continuous Live Streaming Loop (Runs only when inputMode === 'continuous' and isLiveStreaming === true)
  useEffect(() => {
    if (!isLiveStreaming || inputMode === 'manual_constant') return;

    const interval = setInterval(() => {
      tickRef.current += 1;
      const currentTick = tickRef.current;
      setTickCount(currentTick);

      // 1. If in automatic scenario mode, simulate organic environment change
      if (streamScenario !== 'manual') {
        const nextEnv = simulateOceanStep(configRef.current, streamScenario, currentTick);
        setConfig(prev => ({
          ...prev,
          depthM: nextEnv.depthM,
          tempC: nextEnv.tempC,
          salinityPsu: nextEnv.salinityPsu,
          turbidityNtu: nextEnv.turbidityNtu,
          targetDistanceM: nextEnv.targetDistanceM
        }));
      }

      // 2. Continuous Real-Time Battery Discharge Simulation (energy consumed over tick interval)
      setRealtimeBatteryWh(prev => {
        if (!resultsRef.current) return prev;
        const currentSysDrawW = resultsRef.current.totalAverageSystemPowerW || 15;
        const deltaHours = streamRateMs / 3600000;
        const consumedWh = currentSysDrawW * deltaHours;
        return Math.max(1, prev - consumedWh);
      });

      setCalculationTimestamp(Date.now());

      // 3. Update Telemetry History (Last 40 points)
      if (resultsRef.current) {
        const res = resultsRef.current;
        setTelemetryHistory(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString(),
            distance: configRef.current.targetDistanceM,
            turbidity: configRef.current.turbidityNtu,
            depth: configRef.current.depthM,
            freqKhz: res.recommendedFreqKhz,
            powerW: res.activeTransmitPowerW,
            sysPowerW: res.totalAverageSystemPowerW,
            runtimeHours: res.estimatedRuntimeHours,
            snr: res.achievedSNR,
            rangeResCm: res.rangeResolutionCm
          };
          const updated = [...prev, newPoint];
          return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
        });

        // 4. Update Waterfall History (Last 32 pings)
        setWaterfallHistory(prev => {
          const newPing = {
            id: currentTick,
            time: new Date().toLocaleTimeString(),
            fStart: res.fStartKhz,
            fStop: res.fStopKhz,
            fCenter: res.recommendedFreqKhz,
            powerW: res.activeTransmitPowerW,
            snr: res.achievedSNR,
            rangeM: configRef.current.targetDistanceM
          };
          const updated = [newPing, ...prev];
          return updated.length > 32 ? updated.slice(0, 32) : updated;
        });

        // 5. Play audio ping if enabled
        if (audioEnabled && currentTick % 2 === 0) {
          playAcousticPingSound(res.fStartKhz, res.fStopKhz, configRef.current.pulseDurationMs);
        }
      }
    }, streamRateMs);

    return () => clearInterval(interval);
  }, [isLiveStreaming, inputMode, streamScenario, streamRateMs, audioEnabled]);

  return (
    <SonarContext.Provider value={{
      config,
      updateConfig,
      updateMultipleConfig,
      resetToDefaults,
      triggerCalculate,
      isCalculating,
      hasCalculated,
      isOutdated,
      results,
      // Alternative Mode Selection: 'continuous' vs 'manual_constant'
      inputMode,
      setInputMode,
      setModeContinuous,
      setModeManualConstant,
      toggleInputMode,
      // Continuous Real-Time Streaming and LFM Chirp APIs
      isLiveStreaming,
      toggleLiveStreaming,
      streamScenario,
      setStreamScenario,
      streamRateMs,
      setStreamRateMs,
      audioEnabled,
      toggleAudio,
      tickCount,
      realtimeBatteryWh,
      resetBatteryCapacity,
      telemetryHistory,
      waterfallHistory,
      lfmSignal,
      playCurrentChirp,
      exportIqWav,
      injectDisturbance
    }}>
      {children}
    </SonarContext.Provider>
  );
}

export function useSonar() {
  const context = useContext(SonarContext);
  if (!context) {
    throw new Error('useSonar must be used within a SonarProvider');
  }
  return context;
}
