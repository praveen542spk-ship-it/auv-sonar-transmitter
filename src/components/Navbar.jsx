import React from 'react';
import { User, Cpu, Activity, Sliders } from 'lucide-react';
import { useSonar } from '../SonarContext';

export default function Navbar({ activePage, currentUser, onOpenProfile }) {
  const { inputMode, toggleInputMode } = useSonar();

  const getSubsystemTitle = () => {
    switch (activePage) {
      case 'LiveSDR':
        return 'Live Environmental Stream & LFM Chirp';
      case 'SonarInputConfig':
        return 'Input & Configuration';
      case 'AdaptiveSonar':
        return 'Adaptive Sonar Analysis';
      case 'PowerAnalysis':
        return 'Power & Battery Optimization';
      case 'Dashboard':
        return 'Performance Dashboard';
      case 'Profile':
        return 'AUV Mission Station & Fuel Gauge';
      default:
        return 'Low-Power Adaptive SDR Sonar';
    }
  };

  return (
    <header className="aquasense-navbar">
      <div className="nav-left">
        <div className="nav-brand-group">
          <div className="sonar-logo-icon" aria-hidden="true"></div>
          <div className="brand-text-col">
            <span className="brand-title">Adaptive SDR Sonar</span>
            <span className="brand-subtext">{getSubsystemTitle()}</span>
          </div>
        </div>
      </div>

      <div className="nav-right">
        {/* Alternative Mode Toggle Button */}
        <button
          onClick={toggleInputMode}
          title={inputMode === 'continuous' ? "Click to switch to Constant User Inputs (Manual Mode)" : "Click to switch to Continuous Changing Inputs (Live Mode)"}
          style={{
            background: inputMode === 'continuous' ? '#ecfdf5' : '#fef3c7',
            border: `1px solid ${inputMode === 'continuous' ? '#a7f3d0' : '#fde68a'}`,
            color: inputMode === 'continuous' ? '#065f46' : '#92400e',
            borderRadius: 16,
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: inputMode === 'continuous' ? '#10b981' : '#f59e0b',
            boxShadow: inputMode === 'continuous' ? '0 0 6px #10b981' : 'none'
          }} />
          {inputMode === 'continuous' ? 'Live Stream' : 'Constant Mode'}
        </button>

        <span className="badge-tag-blue" style={{ fontSize: 9.5, padding: '3px 8px' }}>
          <Cpu size={12} style={{ marginRight: 4 }} />
          STM32H7 + Artix-7
        </span>

        <button 
          className={`nav-avatar-btn ${activePage === 'Profile' ? 'active-profile' : ''}`} 
          aria-label="User Profile"
          onClick={onOpenProfile}
          title={currentUser?.name ? `Operator: ${currentUser.name} (${currentUser.role || 'Operator'})` : "Operator Station & Telemetry"}
          style={{ 
            cursor: 'pointer', 
            width: 30, 
            height: 30, 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-teal)', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px solid rgba(255,255,255,0.6)', 
            boxShadow: '0 2px 6px rgba(8,84,100,0.25)', 
            padding: 0 
          }}
        >
          <User size={16} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
