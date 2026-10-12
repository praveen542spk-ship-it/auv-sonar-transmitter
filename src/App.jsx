import React, { useState } from 'react';
import { SonarProvider } from './SonarContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import SonarInputConfig from './pages/SonarInputConfig';
import AdaptiveSonar from './pages/AdaptiveSonar';
import PowerAnalysis from './pages/PowerAnalysis';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';

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

  const [activePage, setActivePage] = useState('SonarInputConfig');

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
          <SonarInputConfig 
            onNavigateToAnalysis={() => setActivePage('AdaptiveSonar')} 
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

        {renderCurrentPage()}

        <BottomNav
          activePage={activePage}
          onSelectPage={setActivePage}
        />
      </div>
    </SonarProvider>
  );
}
