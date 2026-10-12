import React from 'react';
import { useSonar } from '../SonarContext';
import { Battery, Cpu, LogOut, Download, Zap, RefreshCw, Radio } from 'lucide-react';

export default function Profile({ currentUser, onLogout }) {
  const { config, results, resetBatteryCapacity, isLiveStreaming, tickCount } = useSonar();

  const handleExportMissionReport = () => {
    const csv = "data:text/csv;charset=utf-8,"
      + "Metric,Value,Unit\n"
      + `Total Battery Pack Capacity,${results.nominalBatteryEnergyWh},Wh\n`
      + `Battery State of Charge,${results.liveSOCPct},%\n`
      + `Remaining Usable Energy,${results.realtimeBatteryWh.toFixed(1)},Wh\n`
      + `Active Transmit Power,${results.activeTransmitPowerW},W\n`
      + `Average System Draw,${results.totalAverageSystemPowerW.toFixed(1)},W\n`
      + `Estimated Remaining Mission,${results.estimatedRuntimeHours},hrs\n`
      + `Adapted Carrier Frequency,${results.recommendedFreqKhz},kHz\n`
      + `Target Distance,${config.targetDistanceM},m\n`
      + `Water Turbidity,${config.turbidityNtu},NTU\n`
      + `Power Savings vs Fixed 80W,${results.powerSavingPct},%\n`
      + `Class D Amplifier Efficiency,${config.amplifierEfficiencyPct},%\n`
      + `Core Processing,STM32H7 @ 168 MHz + Xilinx Artix-7,\n`;

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `AUV_Live_Mission_Battery_Status_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="aquasense-main">
      <div className="page-header-block">
        <div className="page-header-badge-row">
          <span className="badge-tag-blue">● AUV MISSION STATION</span>
          <span className="badge-tag-green">CLEARANCE: LEVEL 4 // {currentUser?.name ? currentUser.name.toUpperCase() : 'OPERATOR'}</span>
          <span className="badge-tag-blue" style={{ background: '#ecfdf5', color: '#064e3b', borderColor: '#a7f3d0' }}>
            {isLiveStreaming ? '● TELEMETRY STREAMING LIVE' : 'MANUAL MODE'}
          </span>
        </div>
        <h1 className="page-title">AUV Mission Station &amp; Battery Telemetry</h1>
        <p className="page-description">
          Autonomous Underwater Vehicle payload power diagnostics, real-time Li-ion battery fuel gauge, and active mission endurance estimation continuously adapting to acoustic transmission conditions.
        </p>
      </div>

      {/* Authenticated Operator Details Card */}
      <section className="aqua-card" style={{ marginBottom: 14 }}>
        <div className="aqua-card-header" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="var(--primary-teal)" />
            <h2 className="aqua-card-title">Authenticated Operator Profile</h2>
          </div>
          <span className="badge-tag-blue">LOGGED TO SUPABASE DATABASE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 11 }}>
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 9.5, color: 'var(--slate-muted)', display: 'block' }}>OPERATOR NAME</span>
            <strong style={{ fontSize: 13, color: 'var(--navy-dark)' }}>{currentUser?.name || 'Praveen Kumar'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 9.5, color: 'var(--slate-muted)', display: 'block' }}>EMAIL / CREDENTIALS</span>
            <strong style={{ fontSize: 12, color: 'var(--primary-teal)' }}>{currentUser?.email || 'praveen@aquasense.org'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 9.5, color: 'var(--slate-muted)', display: 'block' }}>MISSION ROLE</span>
            <strong style={{ fontSize: 12, color: 'var(--mint-green-dark)' }}>{currentUser?.role || 'Sonar Payload Specialist'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 9.5, color: 'var(--slate-muted)', display: 'block' }}>TELEMETRY CALLSIGN</span>
            <strong style={{ fontSize: 12, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{currentUser?.callsign || 'AUV-PRA-01'}</strong>
          </div>
        </div>
      </section>

      {/* Hero Battery Fuel Gauge Card (DYNAMICALLY REACTING IN REAL-TIME) */}
      <section className="duration-hero-card" style={{ marginBottom: 14 }}>
        <div className="duration-hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="duration-icon-box" style={{ background: 'var(--primary-teal)', color: '#ffffff' }}>
              <Battery size={24} />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: 'var(--slate-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>LI-ION {config.batteryVoltageV}V / {config.batteryCapacityAh}Ah PACK ({results.nominalBatteryEnergyWh} Wh)</span>
                {isLiveStreaming && (
                  <span style={{ color: '#10b981', fontSize: 9, fontWeight: 700, background: '#ecfdf5', padding: '1px 6px', borderRadius: 4 }}>
                    ● LIVE ADAPTING
                  </span>
                )}
              </div>
              <div className="duration-val-block">
                <span className="duration-number">{results.estimatedRuntimeHours}</span>
                <span className="duration-unit">hrs remaining</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="duration-gain-badge">SOC: {results.liveSOCPct}%</span>
            <div style={{ fontSize: 9.5, color: 'var(--slate-muted)', marginTop: 4 }}>
              Usable: {results.realtimeBatteryWh.toFixed(0)} Wh
            </div>
            <button
              onClick={resetBatteryCapacity}
              title="Reset battery pack to full usable capacity"
              style={{
                marginTop: 6,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 9.5,
                color: 'var(--primary-teal)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={10} /> Recharge Pack
            </button>
          </div>
        </div>

        {/* Dual Battery Progress Bar */}
        <div className="duration-dual-bar" style={{ marginTop: 10 }}>
          <div className="duration-bar-baseline" style={{ width: `${Math.max(2, Math.min(100, results.liveSOCPct))}%`, background: 'var(--primary-teal)', transition: 'width 0.4s ease' }}></div>
        </div>

        <div className="duration-legend-row" style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Pack Voltage: {config.batteryVoltageV}.0 VDC (Nominal)</span>
          <span style={{ color: 'var(--primary-teal)', fontWeight: 600 }}>
            Active Transmit Power: {results.activeTransmitPowerW} W
          </span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Avg System Power: {results.totalAverageSystemPowerW.toFixed(1)} W
          </span>
          <span style={{ color: '#047857', fontWeight: 600 }}>
            Carrier: {results.recommendedFreqKhz} kHz
          </span>
        </div>
      </section>

      <div className="desktop-two-col-grid">
        {/* Battery & Power Rails */}
        <section className="aqua-card">
          <div className="aqua-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="var(--primary-teal)" />
              <h2 className="aqua-card-title">Power Source &amp; Buck Rails</h2>
            </div>
            <span className="badge-tag-green">&gt;82% CLASS D EFF</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: 'var(--slate-text)' }}>
            <div className="formula-stat-tile">
              <div>
                <strong>Li-ion Battery Pack:</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>{config.batteryVoltageV}V × {config.batteryCapacityAh}Ah Architecture</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{results.nominalBatteryEnergyWh} Wh</span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>High-Power Rail (48V):</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>Class D Transducer Driver (Adaptive)</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                {results.activeTransmitPowerW} W Active Draw ({results.powerSavingPct}% saved)
              </span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>Analog Subsystem Rail (12V):</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>Preamp &amp; Piezo Matching</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>12.0 VDC Regulated</span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>Digital Core Rail (3.3V):</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>STM32H7 + Xilinx Artix-7</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>3.3 VDC Low-Noise</span>
            </div>

            <button 
              className="btn-primary-teal"
              onClick={handleExportMissionReport}
              style={{ padding: '8px 12px', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Download size={14} />
              Export Live Mission Telemetry (.CSV)
            </button>
          </div>
        </section>

        {/* Embedded Payload Specs */}
        <section className="aqua-card">
          <div className="aqua-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={18} color="var(--primary-teal)" />
              <h2 className="aqua-card-title">Embedded Processing Core</h2>
            </div>
            <span className="badge-tag-blue">STM32 + FPGA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: 'var(--slate-text)' }}>
            <div className="formula-stat-tile">
              <div>
                <strong>Main Processing Unit:</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>STM32H7 Series @ 168 MHz</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>2 MB Flash, RTOS</span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>Signal Processing Co-Processor:</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>Xilinx Artix-7 FPGA</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>Parallel LFM Matched Filter</span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>Sampling Converters:</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>Echo ADC &amp; Chirp DAC</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>16-bit, &gt;2 MHz</span>
            </div>

            <div className="formula-stat-tile">
              <div>
                <strong>Acoustic Transducer:</strong>
                <div style={{ fontSize: 10, color: 'var(--slate-muted)' }}>Piezoelectric Array</div>
              </div>
              <span style={{ fontFamily: 'monospace' }}>100–500 kHz Bandwidth</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <button 
                type="button" 
                onClick={onLogout}
                className="filter-pill"
                style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5', width: '100%', padding: '9px', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <LogOut size={14} />
                Log Out of Mission Station
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
