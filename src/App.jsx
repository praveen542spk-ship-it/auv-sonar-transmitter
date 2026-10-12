import React, { useState, Suspense, lazy } from 'react';
import { SonarProvider } from './SonarContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LiveAdaptationBar from './components/LiveAdaptationBar';
import Login from './pages/Login';

const LiveSdrSonar = lazy(() => import('./pages/LiveSdrSonar'));
const SonarInputConfig = lazy(() => import('./pages/SonarInputConfig'));
const AdaptiveSonar = lazy(() => import('./pages/AdaptiveSonar'));
const PowerAnalysis = lazy(() => import('./pages/PowerAnalysis'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('auv_sonar_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('auv_sonar_user');
      return saved ? JSON.parse(saved) : { name: 'Praveen Kumar', email: 'praveen@aquasense.org', role: 'Sonar Specialist' };
    } catch (e) {
      return { name: 'Praveen Kumar', email: 'praveen@aquasense.org', role: 'Sonar Specialist' };
    }
  });

  // Default directly to the continuous real-time SDR & LFM Chirp Studio
  const [activePage, setActivePage] = useState('LiveSDR');

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('auv_sonar_auth', 'true');
      sessionStorage.setItem('auv_sonar_user', JSON.stringify(userData));
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('auv_sonar_auth');
      sessionStorage.removeItem('auv_sonar_user');
    } catch (e) {}
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'LiveSDR':
        return (
          <LiveSdrSonar
            onNavigateToInputs={() => setActivePage('SonarInputConfig')}
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')}
            onNavigateToPower={() => setActivePage('PowerAnalysis')}
          />
        );
      case 'SonarInputConfig':
        return (
          <SonarInputConfig 
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')} 
          />
        );
      case 'AdaptiveSonar':
        return (
          <AdaptiveSonar 
            onNavigateToInputs={() => setActivePage('SonarInputConfig')}
            onNavigateToPower={() => setActivePage('PowerAnalysis')}
          />
        );
      case 'PowerAnalysis':
        return (
          <PowerAnalysis 
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')}
            onNavigateToDashboard={() => setActivePage('Dashboard')}
          />
        );
      case 'Dashboard':
        return (
          <Dashboard 
            onNavigateToInputs={() => setActivePage('SonarInputConfig')}
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')}
            onNavigateToPower={() => setActivePage('PowerAnalysis')}
          />
        );
      case 'Profile':
        return <Profile currentUser={currentUser} onLogout={handleLogout} />;
      default:
        return (
          <LiveSdrSonar
            onNavigateToInputs={() => setActivePage('SonarInputConfig')}
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')}
            onNavigateToPower={() => setActivePage('PowerAnalysis')}
          />
        );
    }
  };

  return (
    <SonarProvider>
      <div className="aquasense-app">
        <Navbar
          activePage={activePage}
          currentUser={currentUser}
          onOpenProfile={() => setActivePage('Profile')}
        />

        <main id="main-content" role="main" className="aquasense-main-content">
          <LiveAdaptationBar />
          <Suspense fallback={
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064E3B', fontSize: 13, fontWeight: 600 }}>
              Connecting Live SDR Hydro-Acoustic Stream...
            </div>
          }>
            {renderCurrentPage()}
          </Suspense>
        </main>

        <BottomNav
          activePage={activePage}
          onSelectPage={(pageId) => setActivePage(pageId)}
        />
      </div>
    </SonarProvider>
  );
}
