import React, { useState } from 'react';
import { useSonar } from '../SonarContext';
import { 
  Radio, 
  Activity, 
  Zap, 
  Waves, 
  Download, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function LiveSdrSonar({ onNavigateToInputs, onNavigateToAnalysis, onNavigateToPower }) {
  const {
    config,
    updateConfig,
    results,
    isLiveStreaming,
    toggleLiveStreaming,
    streamScenario,
    setStreamScenario,
    streamRateMs,
    setStreamRateMs,
    audioEnabled,
    toggleAudio,
    telemetryHistory,
    waterfallHistory,
    lfmSignal,
    playCurrentChirp,
    exportIqWav,
    injectDisturbance
  } = useSonar();

  const [activeTab, setActiveTab] = useState('lfm'); // 'lfm' | 'waterfall' | 'matched_filter' | 'telemetry'

  // Calculations for Visual Dials
  const minF = results.minF || 100;
  const maxF = results.maxF || 500;
  const curF = results.recommendedFreqKhz || 250;
  const freqPct = Math.max(0, Math.min(100, ((curF - minF) / Math.max(1, maxF - minF)) * 100));

  const maxPwr = config.transmitPowerLimitW || 100;
  const curPwr = results.activeTransmitPowerW || 20;
  const pwrPct = Math.max(0, Math.min(100, (curPwr / Math.max(1, maxPwr)) * 100));

  return (
    <div className="aquasense-main">
      {/* Page Header */}
      <div className="page-header-block">
        <div className="page-header-badge-row">
          <span className="badge-tag-blue">● CONTINUOUS ADAPTIVE SDR SONAR</span>
          <span className="badge-tag-green">REAL-TIME CLOSED-LOOP ENGINE</span>
          <span className="badge-tag-blue" style={{ background: '#ecfdf5', color: '#064e3b', borderColor: '#a7f3d0' }}>
            LFM CHIRP &amp; MATCHED FILTER
          </span>
        </div>
        <h1 className="page-title">Live Environmental SDR Sonar &amp; Adaptive LFM Chirp</h1>
        <p className="page-description">
          Continuously senses dynamic ocean conditions (turbidity, target range, thermocline depth). 
          Instantly calculates acoustic transmission loss, dynamically adapts carrier frequency and transmit power, 
          and generates pulse-compressed Linear Frequency Modulated (LFM) chirps for maximum AUV endurance.
        </p>
      </div>

      {/* Main Grid: Left Panel (Environmental & Telemetry Controls) + Right Panel (Waveforms & Adaptation) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 16 }}>
        
        {/* LEFT COLUMN: Real-Time Environmental Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Card 1: Live Environmental Input Controls */}
          <div className="sonar-card">
            <div className="sonar-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Waves size={16} color="var(--primary-teal)" />
                <h2 className="sonar-card-title">Outside Environment Stream</h2>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: isLiveStreaming ? '#059669' : '#d97706' }}>
                {isLiveStreaming ? '● STREAMING LIVE' : 'MANUAL CONTROL'}
              </span>
            </div>

            <p style={{ fontSize: 11, color: 'var(--slate-muted)', marginBottom: 12 }}>
              Adjust environment manually or let the live stream fluctuate dynamically. Calculations adapt instantly on every tick.
            </p>

            {/* Slider 1: Target Distance */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Target Distance R(t):</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-teal)' }}>{config.targetDistanceM} m</span>
              </div>
              <input
                type="range"
                min="10"
                max="450"
                step="1"
                value={config.targetDistanceM}
                onChange={(e) => updateConfig('targetDistanceM', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-teal)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--slate-muted)' }}>
                <span>10m (Close obstacle)</span>
                <span>450m (Deep basin)</span>
              </div>
            </div>

            {/* Slider 2: Turbidity */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Water Turbidity:</span>
                <span style={{ fontWeight: 700, color: config.turbidityNtu > 40 ? '#d97706' : 'var(--primary-teal)' }}>
                  {config.turbidityNtu} NTU
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.turbidityNtu}
                onChange={(e) => updateConfig('turbidityNtu', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--slate-muted)' }}>
                <span>0 NTU (Clear ocean)</span>
                <span>100 NTU (Dense benthic plume)</span>
              </div>
            </div>

            {/* Slider 3: Depth */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Water Depth:</span>
                <span style={{ fontWeight: 700 }}>{config.depthM} m</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="2"
                value={config.depthM}
                onChange={(e) => updateConfig('depthM', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#064e3b', cursor: 'pointer' }}
              />
            </div>

            {/* Slider 4: Water Temperature */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Water Temp &amp; Salinity:</span>
                <span style={{ fontWeight: 700 }}>{config.tempC}°C / {config.salinityPsu} PSU</span>
              </div>
              <input
                type="range"
                min="2"
                max="32"
                step="0.5"
                value={config.tempC}
                onChange={(e) => updateConfig('tempC', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>

            {/* Computed Instantaneous Medium Parameters */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: 8, 
              padding: '10px 12px', 
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 10.5
            }}>
              <div>
                <span style={{ color: 'var(--slate-muted)' }}>Sound Speed c:</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-teal)' }}>
                  {results.effectiveSoundSpeed} <span style={{ fontSize: 9.5, fontWeight: 400 }}>m/s</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--slate-muted)' }}>Absorption α:</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>
                  {results.effectiveAlpha_dB_km} <span style={{ fontSize: 9.5, fontWeight: 400 }}>dB/km</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--slate-muted)' }}>Two-Way Loss 2TL:</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#b45309' }}>
                  {results.twoWayTL} <span style={{ fontSize: 9.5, fontWeight: 400 }}>dB</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--slate-muted)' }}>Round-Trip Delay:</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#4338ca' }}>
                  {results.roundTripDelayMs} <span style={{ fontSize: 9.5, fontWeight: 400 }}>ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Continuous Adaptation Status Card */}
          <div className="sonar-card">
            <div className="sonar-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--primary-teal)" />
                <h2 className="sonar-card-title">Cognitive Adaptation Logic</h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 10 }}>
                <span style={{ fontWeight: 700, color: '#064e3b', display: 'block', marginBottom: 2 }}>
                  Frequency Decision:
                </span>
                <span style={{ color: '#047857' }}>
                  {config.targetDistanceM > 200 || config.turbidityNtu > 45 
                    ? `⬇️ Downshifted to ${results.recommendedFreqKhz} kHz to avoid ${results.effectiveAlpha_dB_km} dB/km high-frequency absorption and scattering.`
                    : `⬆️ Upshifted to ${results.recommendedFreqKhz} kHz providing ${results.rangeResolutionCm} cm ultra-high spatial range resolution.`}
                </span>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}>
                <span style={{ fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 2 }}>
                  Power Scaling Decision:
                </span>
                <span style={{ color: '#b45309' }}>
                  Adjusted transmit power to <strong>{results.activeTransmitPowerW} W</strong> (SL: {results.requiredSL} dB) to achieve exactly <strong>{results.achievedSNR} dB SNR lock</strong> post-compression gain (+{results.processingGain} dB).
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                <span>Power Savings vs Fixed 80W:</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: 13 }}>+{results.powerSavingPct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                <span>Estimated Battery Mission Life:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary-teal)', fontSize: 13 }}>{results.estimatedRuntimeHours} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Waveform Displays, Waterfall, and Adaptation Gauges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Card 3: Continuous Frequency & Power Adaptation Meters */}
          <div className="sonar-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              
              {/* Frequency Adaptation Gauge */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-teal)', textTransform: 'uppercase' }}>
                    Carrier Frequency f_c(t)
                  </span>
                  <span style={{ fontSize: 9.5, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    ADAPTING LIVE
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'var(--font-mono)' }}>
                    {results.recommendedFreqKhz}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-muted)' }}>kHz</span>
                  <span style={{ fontSize: 10, color: '#059669', marginLeft: 'auto', fontWeight: 600 }}>
                    [{results.fStartKhz} → {results.fStopKhz} kHz]
                  </span>
                </div>

                {/* Frequency Bar Gauge */}
                <div style={{ background: '#e2e8f0', borderRadius: 6, height: 10, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${freqPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #064e3b 100%)',
                    transition: 'width 0.25s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--slate-muted)', marginTop: 4 }}>
                  <span>{minF} kHz (Long Range/Turbid)</span>
                  <span>{maxF} kHz (High Res)</span>
                </div>
              </div>

              {/* Power Adaptation Gauge */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                    Transmit Power P_tx(t)
                  </span>
                  <span style={{ fontSize: 9.5, background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    SNR LOCKED
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                    {results.activeTransmitPowerW}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-muted)' }}>Watts</span>
                  <span style={{ fontSize: 10, color: '#059669', marginLeft: 'auto', fontWeight: 600 }}>
                    {results.powerSavingPct}% saved
                  </span>
                </div>

                {/* Power Bar Gauge */}
                <div style={{ background: '#e2e8f0', borderRadius: 6, height: 10, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${pwrPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #b45309 100%)',
                    transition: 'width 0.25s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--slate-muted)', marginTop: 4 }}>
                  <span>5W (Min Whisper)</span>
                  <span>{maxPwr}W (Max Limit)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Live LFM Chirp & Signal Processing Visualizer */}
          <div className="sonar-card" style={{ flex: 1 }}>
            
            {/* Visualizer Mode Tabs & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`filter-pill ${activeTab === 'lfm' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lfm')}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  ⚡ LFM Chirp Waveform
                </button>
                <button
                  className={`filter-pill ${activeTab === 'waterfall' ? 'active' : ''}`}
                  onClick={() => setActiveTab('waterfall')}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  🌊 Spectrogram Waterfall
                </button>
                <button
                  className={`filter-pill ${activeTab === 'matched_filter' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matched_filter')}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  🎯 Matched Filter &amp; Pulse Compression
                </button>
                <button
                  className={`filter-pill ${activeTab === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setActiveTab('telemetry')}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  📈 Telemetry Strip
                </button>
              </div>

              {/* SDR & Audio Action Buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={playCurrentChirp}
                  title="Play Audible Acoustic Chirp Ping"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #a7f3d0',
                    color: '#064e3b',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Volume2 size={13} />
                  Test Audio Ping
                </button>

                <button
                  onClick={exportIqWav}
                  title="Download Baseband I/Q Samples as standard WAV for SDR Hardware"
                  style={{
                    background: 'var(--primary-teal)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Download size={13} />
                  Export SDR I/Q (.WAV)
                </button>
              </div>
            </div>

            {/* TAB 1: LFM CHIRP WAVEFORM & TRAJECTORY */}
            {activeTab === 'lfm' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>
                    Transmitted Chirp: s(t) = w(t) · cos(2π f₀ t + π μ t²)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--slate-muted)' }}>
                    Bandwidth: {results.effectiveBandwidthKhz} kHz • Sweep Rate: {results.sweepRateKhzMs} kHz/ms • Time-BW: {results.timeBandwidthProduct}
                  </span>
                </div>

                {/* SVG Oscilloscope Display */}
                <div style={{ background: '#0a1d17', borderRadius: 8, padding: '12px 16px', border: '1px solid #133329', position: 'relative' }}>
                  <svg viewBox="0 0 700 160" style={{ width: '100%', height: 160, display: 'block' }}>
                    {/* Oscilloscope Grid Lines */}
                    <line x1="0" y1="80" x2="700" y2="80" stroke="#133329" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="175" y1="0" x2="175" y2="160" stroke="#133329" strokeWidth="0.8" />
                    <line x1="350" y1="0" x2="350" y2="160" stroke="#133329" strokeWidth="0.8" />
                    <line x1="525" y1="0" x2="525" y2="160" stroke="#133329" strokeWidth="0.8" />

                    {/* Window Envelope */}
                    {lfmSignal?.chirpPoints?.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="1.2"
                        strokeDasharray="4 2"
                        opacity="0.6"
                        points={lfmSignal.chirpPoints.map((p, idx) => {
                          const x = (idx / (lfmSignal.chirpPoints.length - 1)) * 700;
                          const yTop = 80 - (p.envelope * 65);
                          return `${x.toFixed(1)},${yTop.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}

                    {/* LFM Chirp Time-Domain Waveform */}
                    {lfmSignal?.chirpPoints?.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        points={lfmSignal.chirpPoints.map((p, idx) => {
                          const x = (idx / (lfmSignal.chirpPoints.length - 1)) * 700;
                          const y = 80 - (p.tx * 65);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}
                  </svg>

                  {/* On-Screen Telemetry Overlay */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: 'monospace', color: '#6ee7b7' }}>
                    <span>t = 0 ms (f_start: {results.fStartKhz} kHz)</span>
                    <span style={{ color: '#fbbf24' }}>μ = {results.sweepRateKhzMs} kHz/ms (LFM Up-Chirp)</span>
                    <span>t = {config.pulseDurationMs} ms (f_stop: {results.fStopKhz} kHz)</span>
                  </div>
                </div>

                {/* Instantaneous Frequency Ramp Trajectory f(t) */}
                <div style={{ marginTop: 12, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: 'var(--primary-teal)' }}>Instantaneous Frequency Trajectory f(t) = f₀ + μ t</span>
                    <span style={{ color: '#059669' }}>Tukey-Windowed Envelope (α = 0.20)</span>
                  </div>
                  <div style={{ height: 26, background: '#e2e8f0', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      left: `${((results.fStartKhz - minF) / (maxF - minF)) * 100}%`,
                      width: `${Math.max(5, ((results.fStopKhz - results.fStartKhz) / (maxF - minF)) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #047857 100%)',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      B = {results.effectiveBandwidthKhz} kHz
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--slate-muted)', marginTop: 2 }}>
                    <span>{minF} kHz</span>
                    <span>Transducer Center: 300 kHz</span>
                    <span>{maxF} kHz</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROLLING SPECTROGRAM WATERFALL */}
            {activeTab === 'waterfall' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>
                    Continuous Rolling Spectrogram Waterfall (Sonogram History)
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--slate-muted)' }}>
                    Live ping log scrolling downward
                  </span>
                </div>

                <div style={{
                  background: '#041510',
                  borderRadius: 8,
                  padding: 10,
                  border: '1px solid #0f2e24',
                  height: 220,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}>
                  {waterfallHistory.length === 0 ? (
                    <div style={{ color: '#6ee7b7', fontSize: 11, textAlign: 'center', padding: '30px 0' }}>
                      Gathering waterfall pings...
                    </div>
                  ) : (
                    waterfallHistory.map((ping) => {
                      const leftPct = ((ping.fStart - minF) / (maxF - minF)) * 100;
                      const widthPct = Math.max(3, ((ping.fStop - ping.fStart) / (maxF - minF)) * 100);
                      return (
                        <div key={ping.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9.5, height: 16 }}>
                          <span style={{ color: '#64748b', fontFamily: 'monospace', width: 62 }}>
                            {ping.time.split(' ')[0]}
                          </span>
                          <div style={{ flex: 1, height: 12, background: '#0a231b', borderRadius: 2, position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #059669 0%, #34d399 50%, #fbbf24 100%)',
                              borderRadius: 2,
                              boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)'
                            }} />
                          </div>
                          <span style={{ color: '#34d399', fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                            {ping.fCenter} kHz
                          </span>
                          <span style={{ color: '#fbbf24', fontFamily: 'monospace', width: 40, textAlign: 'right' }}>
                            {ping.powerW}W
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--slate-muted)', marginTop: 4 }}>
                  <span>{minF} kHz</span>
                  <span>Spectrogram Frequency Axis →</span>
                  <span>{maxF} kHz</span>
                </div>
              </div>
            )}

            {/* TAB 3: MATCHED FILTER & PULSE COMPRESSION */}
            {activeTab === 'matched_filter' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>
                    Matched Filter: y(t) = s_rx(t) ⊛ s_ref*(-t) • Pulse Compression Peak
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#059669' }}>
                    Compression Gain: +{results.processingGain} dB • Range Resolution: {results.rangeResolutionCm} cm
                  </span>
                </div>

                <div style={{ background: '#0a1d17', borderRadius: 8, padding: '12px 16px', border: '1px solid #133329' }}>
                  <svg viewBox="0 0 700 160" style={{ width: '100%', height: 160, display: 'block' }}>
                    <line x1="0" y1="120" x2="700" y2="120" stroke="#133329" strokeWidth="1" strokeDasharray="3 3" />
                    
                    {/* Raw Noisy Echo Received */}
                    {lfmSignal?.rxPoints?.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1"
                        opacity="0.75"
                        points={lfmSignal.rxPoints.map((p, idx) => {
                          const x = (idx / (lfmSignal.rxPoints.length - 1)) * 700;
                          const y = 80 - (p.val * 35);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}

                    {/* Compressed Matched Filter Sinc Peak */}
                    {lfmSignal?.matchedFilterPoints?.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.4"
                        points={lfmSignal.matchedFilterPoints.map((p, idx) => {
                          const x = (idx / (lfmSignal.matchedFilterPoints.length - 1)) * 700;
                          const y = 140 - (p.val * 110);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}
                  </svg>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: 'monospace' }}>
                    <span style={{ color: '#94a3b8' }}>Grey Trace: Raw Underwater Echo in Noise (NL: {results.ambientNoiseNL} dB)</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>Cyan Peak: Compressed Sinc Pulse (SNR: {results.achievedSNR} dB)</span>
                    <span style={{ color: '#34d399' }}>Target Delay: {results.roundTripDelayMs} ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TELEMETRY STRIP */}
            {activeTab === 'telemetry' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>
                    Live Adaptation Telemetry Trends (Last 40 Pings)
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--slate-muted)' }}>
                    Continuous adaptation history
                  </span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)' }}>
                  <svg viewBox="0 0 700 140" style={{ width: '100%', height: 140, display: 'block' }}>
                    <line x1="0" y1="70" x2="700" y2="70" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Frequency Trace (Green) */}
                    {telemetryHistory.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2"
                        points={telemetryHistory.map((p, idx) => {
                          const x = (idx / (telemetryHistory.length - 1)) * 700;
                          const y = 130 - (((p.freqKhz - minF) / (maxF - minF)) * 120);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}

                    {/* Power Trace (Amber) */}
                    {telemetryHistory.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                        points={telemetryHistory.map((p, idx) => {
                          const x = (idx / (telemetryHistory.length - 1)) * 700;
                          const y = 130 - ((p.powerW / maxPwr) * 120);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}
                  </svg>

                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, fontSize: 10.5, fontWeight: 600 }}>
                    <span style={{ color: '#059669' }}>● Adapted Frequency f_c (100 - 500 kHz)</span>
                    <span style={{ color: '#d97706' }}>● Transmit Power P_tx (0 - 100 W)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Quick Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
              <button
                className="filter-pill"
                onClick={onNavigateToInputs}
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                ⚙️ Deep Parameter Inputs
              </button>
              <button
                className="filter-pill"
                onClick={onNavigateToAnalysis}
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                📊 Frequency Sweeps &amp; Attenuation
              </button>
              <button
                className="btn-primary-teal"
                onClick={onNavigateToPower}
                style={{ fontSize: 11, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>Battery &amp; Power Optimization</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
