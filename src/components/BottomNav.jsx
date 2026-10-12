import React from 'react';
import { Sliders, Activity, BatteryCharging, LayoutDashboard, User } from 'lucide-react';

export default function BottomNav({ activePage, onSelectPage }) {
  const navTabs = [
    { id: 'SonarInputConfig', label: 'Inputs', icon: Sliders },
    { id: 'AdaptiveSonar', label: 'Adaptive Sonar', icon: Activity },
    { id: 'PowerAnalysis', label: 'Power & Battery', icon: BatteryCharging },
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Profile', label: 'AUV Mission', icon: User },
  ];

  return (
    <div className="aquasense-dock-container">
      <nav className="dock-tabs-grid" aria-label="Main Dock Navigation" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              className={`dock-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              <span className="dock-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
