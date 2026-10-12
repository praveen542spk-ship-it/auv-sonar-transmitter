import React from 'react';
import { useSonar } from '../SonarContext';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Zap, 
  Activity, 
  Waves, 
  Sliders, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';

export default function LiveAdaptationBar() {
  const { 
    config, 
    results, 
    inputMode,
    setModeContinuous,
    setModeManualConstant,
    toggleInputMode,
    isLiveStreaming, 
    toggleLiveStreaming, 
    streamScenario, 
    setStreamScenario, 
    streamRateMs, 
    setStreamRateMs, 
    audioEnabled, 
    toggleAudio, 
    injectDisturbance 
  } = useSonar();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #064E3B 0%, #0a3d31 100%)',
      color: '#ffffff',
      borderRadius: 12,
      padding: '12px 18px',
      marginBottom: 16,
      boxShadow: '0 4px 14px rgba(6,78,59,0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      border: '1px solid rgba(167, 243, 208, 0.25)'
    }}>
      {/* Top Status & Mode Switcher Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        
        {/* Left: Prominent Alternative Mode Switcher Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Segmented Alternative Button */}
          <div style={{ 
            display: 'inline-flex', 
            background: 'rgba(0, 0, 0, 0.35)', 
            borderRadius: 8, 
            padding: 3, 
            border: '1px solid rgba(255, 255, 255, 0.2)' 
          }}>
            <button
              onClick={setModeContinuous}
              title="Continuous Live Inputs: Live ocean stream continuously changes inputs and adapts frequency/power in real time"
              style={{
                background: inputMode === 'continuous' ? '#10b981' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: inputMode === 'continuous' ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Activity size={14} />
              🌊 Continuous Changing Inputs
            </button>
            <button
              onClick={setModeManualConstant}
              title="Constant User Inputs: Stops continuous stream and holds values constant so you can enter your own inputs"
              style={{
                background: inputMode === 'manual_constant' ? '#f59e0b' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: inputMode === 'manual_constant' ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Sliders size={14} />
              ✋ Constant User Inputs (Manual)
            </button>
          </div>

          {inputMode === 'continuous' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.85 }}>Scenario:</span>
                <select 
                  value={streamScenario}
                  onChange={(e) => setStreamScenario(e.target.value)}
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="random_drift" style={{ color: '#111827' }}>🌊 Ocean Drift (Organic)</option>
                  <option value="approaching_target" style={{ color: '#111827' }}>🎯 Obstacle Approach (250m → 20m)</option>
                  <option value="turbidity_spike" style={{ color: '#111827' }}>🌫️ Turbidity Plume (Scattering Surge)</option>
                  <option value="thermocline_dive" style={{ color: '#111827' }}>📉 Thermocline Dive (Cold Deep Layer)</option>
                  <option value="manual" style={{ color: '#111827' }}>🎛️ Manual Sliders (Instant Update)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.85 }}>Ping Rate:</span>
                <select
                  value={streamRateMs}
                  onChange={(e) => setStreamRateMs(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={200} style={{ color: '#111827' }}>Fast (200ms / 5 Hz)</option>
                  <option value={350} style={{ color: '#111827' }}>Nominal (350ms / ~3 Hz)</option>
                  <option value={700} style={{ color: '#111827' }}>Relaxed (700ms / 1.4 Hz)</option>
                  <option value={1200} style={{ color: '#111827' }}>Slow (1.2s)</option>
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#fef3c7' }}>
              <span>🔒 Stream stopped. Enter or slide your constant inputs below — results calculate instantly!</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleLiveStreaming}
            title={isLiveStreaming ? "Pause Stream" : "Resume Stream"}
            style={{
              background: isLiveStreaming ? 'rgba(239, 68, 68, 0.85)' : '#10b981',
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {isLiveStreaming ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume Live</>}
          </button>

          <button
            onClick={toggleAudio}
            title={audioEnabled ? "Mute Acoustic Ping Audio" : "Enable Acoustic Ping Audio (Web Audio)"}
            style={{
              background: audioEnabled ? '#10b981' : 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {audioEnabled ? <><Volume2 size={14} /> Audio ON</> : <><VolumeX size={14} /> Muted</>}
          </button>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => injectDisturbance('turbidity_spike')}
              title="Inject Sudden 85 NTU Turbidity Plume"
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fef3c7',
                padding: '5px 8px',
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ +Turbidity
            </button>
            <button
              onClick={() => injectDisturbance('obstacle_close')}
              title="Inject Obstacle Approach at 22m"
              style={{
                background: 'rgba(59, 130, 246, 0.25)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                color: '#dbeafe',
                padding: '5px 8px',
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ +Close Target
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Live Metrics Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 8,
        background: 'rgba(0, 0, 0, 0.22)',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 11
      }}>
        {/* Metric 1: Distance */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9.5, opacity: 0.75, textTransform: 'uppercase' }}>Target Distance R(t)</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>
            {config.targetDistanceM} <span style={{ fontSize: 10, fontWeight: 400 }}>m</span>
          </span>
        </div>

        {/* Metric 2: Turbidity */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9.5, opacity: 0.75, textTransform: 'uppercase' }}>Water Turbidity</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: config.turbidityNtu > 45 ? '#fcd34d' : '#a7f3d0' }}>
            {config.turbidityNtu} <span style={{ fontSize: 10, fontWeight: 400 }}>NTU</span>
          </span>
        </div>

        {/* Metric 3: Water Depth & Temp */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9.5, opacity: 0.75, textTransform: 'uppercase' }}>Depth / Temp</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
            {config.depthM}m <span style={{ fontSize: 10, opacity: 0.75 }}>/ {config.tempC}°C</span>
          </span>
        </div>

        {/* Metric 4: Adapted Frequency */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(16, 185, 129, 0.18)', padding: '2px 8px', borderRadius: 6 }}>
          <span style={{ fontSize: 9.5, color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase' }}>
            ⚡ Adapted Carrier f(t)
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>
            {results.recommendedFreqKhz} <span style={{ fontSize: 10, fontWeight: 500 }}>kHz</span>
          </span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>
            [{results.fStartKhz} → {results.fStopKhz} kHz]
          </span>
        </div>

        {/* Metric 5: Adapted Transmit Power */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(245, 158, 11, 0.18)', padding: '2px 8px', borderRadius: 6 }}>
          <span style={{ fontSize: 9.5, color: '#fde68a', fontWeight: 600, textTransform: 'uppercase' }}>
            🔋 Adapted Power P_tx
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>
            {results.activeTransmitPowerW} <span style={{ fontSize: 10, fontWeight: 500 }}>W</span>
          </span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>
            {results.powerSavingPct}% saved vs 80W
          </span>
        </div>

        {/* Metric 6: SNR Lock & Resolution */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9.5, opacity: 0.75, textTransform: 'uppercase' }}>SNR Lock / Res</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
            {results.achievedSNR} <span style={{ fontSize: 10, fontWeight: 400 }}>dB</span>
          </span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>
            ΔR: {results.rangeResolutionCm} cm
          </span>
        </div>
      </div>
    </div>
  );
}
