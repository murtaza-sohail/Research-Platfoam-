import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { Sparkles, GraduationCap, Shield } from 'lucide-react';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header-nav print-hide">
          <div className="brand-badge">
            <div className="brand-logo-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="brand-title">DeepResearch AI</div>
              <div className="brand-tagline">Google Scholar & Global Web Autonomous Research</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="badge-pill bg-scholar-soft text-scholar">
              <GraduationCap size={13} className="icon-mr" />
              Scholar & arXiv Active
            </div>
            <div className="badge-pill bg-success-soft text-success">
              <Shield size={13} className="icon-mr" />
              Verified Multi-Agent Swarm
            </div>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
