import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  Calendar,
  Filter,
  Download,
  Briefcase
} from 'lucide-react';
import StartupSidebar, { StartupTopbarActions, StartupBackButton } from '../../components/StartupSidebar';
import { useAuth } from '../../context/AuthContext';
import { useStartupAppearance } from '../../utils/startupTheme';
import './C1.css';

const C3: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const appearance = useStartupAppearance();
  const [activeTab, setActiveTab] = useState('Shortlisted (1)');

  const handleExport = () => {
    const headers = ['Candidate Name', 'Role Applied', 'Status', 'Applied At', 'Match Score'];
    const row = ['Rajini', 'Software Engineer Intern', 'SHORTLISTED', 'MAR 9, 2026', '96%'];
    const csv = [headers, row]
      .map((r) => r.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates_shortlisted_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { name: 'All Requests (4)', path: '/startup/candidates' },
    { name: 'New (1)', path: '/startup/c1' },
    { name: 'Reviewing (1)', path: '/startup/c2' },
    { name: 'Shortlisted (1)', path: '/startup/c3' }
  ];

  const handleTabClick = (tab: any) => {
    setActiveTab(tab.name);
    if (tab.path !== '/startup/shortlisted') {
      navigate(tab.path);
    }
  };

  return (
    <div className={`c1-container startup-theme-${appearance}`}>
      <StartupSidebar />

      {/* Main Content */}
      <main className="c1-main">
        <header className="c1-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <StartupBackButton />
            <div className="c1-search-wrapper">
              <Search className="c1-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search candidates or jobs..."
                className="c1-search-input"
              />
            </div>
          </div>

          <div className="c1-header-actions">
            <StartupTopbarActions appearance={appearance} />
          </div>
        </header>

        <div className="c1-content">
          <div className="c1-content-header">
            <div className="c1-title-area">
              <h2>Job Requests from Students</h2>
              <p>Review and manage incoming applications from the university partner network.</p>
            </div>
            <div className="c1-action-buttons">
              <button className="c1-btn-secondary">
                <Filter size={16} />
                Filter
              </button>
              <button className="c1-btn-secondary" onClick={handleExport}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="c1-tabs-container">
            <div className="c1-tabs-group">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  className={`c1-tab ${activeTab === tab.name ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab.name}
                </button>
              ))}
            </div>
            <button className="c1-ai-ats-btn" onClick={() => navigate('/startup/analyse')}>
              <Sparkles size={16} />
              AI ATS Analyzer
            </button>
          </div>

          <div className="c1-candidate-list">
            <div className="c1-candidate-card">
              <img 
                src="/rajini_avatar.png" 
                alt="Rajini" 
                className="c1-candidate-avatar"
                onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Rajini&background=F1F5F9&color=0F172A'; }}
              />
              <div className="c1-candidate-info">
                <div className="c1-candidate-name-row">
                  <span className="c1-candidate-name">Rajini</span>
                  <span className="c1-badge-new" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>SHORTLISTED</span>
                </div>
                <div className="c1-candidate-meta">
                  <div className="c1-meta-item">
                    <Briefcase size={14} />
                    <span>Software Engineer Intern</span>
                  </div>
                  <div className="c1-meta-item">
                    <Calendar size={14} />
                    <span>MAR 9, 2026</span>
                  </div>
                </div>
              </div>

              <div className="c1-candidate-score">
                <span className="c1-score-value">96%</span>
                <span className="c1-score-label">MATCH SCORE</span>
              </div>

              <div className="c1-candidate-actions">
                <button 
                  className="c1-btn-secondary"
                  onClick={() => navigate('/startup/candidates/profile')}
                >
                  View Profile
                </button>
                <button className="c1-btn-primary" onClick={() => navigate('/startup/interviews')}>
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>

          <div className="c1-pagination">
            <div className="c1-pagination-info">
              Showing 1 to 1 of 1 candidates
            </div>
            <div className="c1-pagination-controls">
              <button className="c1-page-btn">Previous</button>
              <button className="c1-page-btn active small">1</button>
              <button className="c1-page-btn small">2</button>
              <button className="c1-page-btn small">3</button>
              <button className="c1-page-btn">Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default C3;
