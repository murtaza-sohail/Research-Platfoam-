import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api, { API_BASE_URL } from '../services/api';
import { 
  Sparkles, Search, GraduationCap, Globe, BookOpen, 
  Layers, CheckCircle2, AlertCircle, RefreshCw, 
  ArrowRight, ShieldCheck, Terminal, Compass,
  BarChart3, FileText, Cpu
} from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import SourceList from '../components/SourceList';

const PIPELINE_STAGES = [
  { key: 'planning', label: 'Query Decomposition', icon: Compass },
  { key: 'searching', label: 'Scholar & Web Search', icon: Globe },
  { key: 'collecting', label: 'Document Ingestion', icon: Layers },
  { key: 'processing', label: 'Content Extraction', icon: Cpu },
  { key: 'retrieving', label: 'Semantic Ranking', icon: BarChart3 },
  { key: 'synthesizing', label: '2-3 Page Synthesis', icon: FileText },
  { key: 'completed', label: 'Monograph Verified', icon: CheckCircle2 }
];

const SUGGESTIONS = [
  "Latest breakthroughs in solid-state lithium batteries for EV commercialization",
  "Quantum computing scalability bottlenecks and error correction in 2026",
  "Autonomous Multi-Agent AI System Architectures and consensus protocols",
  "CRISPR gene editing therapeutic clinical trial outcomes and delivery vectors"
];

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [subQuestions, setSubQuestions] = useState([]);
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('report'); // 'report' or 'sources'
  const [includeScholar, setIncludeScholar] = useState(true);

  const pollingRef = useRef(null);

  // Poll for status and live telemetry
  useEffect(() => {
    if (runId && status !== 'completed' && status !== 'failed') {
      pollingRef.current = setInterval(async () => {
        try {
          let res;
          try {
            res = await api.get(`/api/research/${runId}`);
          } catch (pollErr) {
            if (!API_BASE_URL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              res = await axios.get(`http://localhost:5000/api/research/${runId}`);
            } else {
              throw pollErr;
            }
          }
          
          const data = res.data;
          setStatus(data.status);
          setProgress(data.progress || 0);

          if (data.subQuestions?.length) {
            setSubQuestions(data.subQuestions);
          }

          if (data.stats) {
            setStats(data.stats);
          }
          
          if (data.status === 'completed') {
            if (data.report) {
              setReport(data.report);
              fetchSources(runId);
            } else {
              // Retry fetching report if not yet serialized
              setTimeout(async () => {
                try {
                  const retryRes = await api.get(`/api/research/${runId}`);
                  if (retryRes.data?.report) {
                    setReport(retryRes.data.report);
                    fetchSources(runId);
                  }
                } catch (rErr) {}
              }, 1000);
            }
          } else if (data.status === 'failed') {
            setErrorMsg(data.error || 'The autonomous research pipeline encountered an error during synthesis.');
          }
        } catch (err) {
          console.error('Error polling research status:', err);
        }
      }, 1500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [runId, status]);

  // Fetch sources list
  const fetchSources = async (id) => {
    try {
      let res;
      try {
        res = await api.get(`/api/research/${id}/sources`);
      } catch (fetchErr) {
        if (!API_BASE_URL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          res = await axios.get(`http://localhost:5000/api/research/${id}/sources`);
        } else {
          throw fetchErr;
        }
      }
      if (Array.isArray(res.data)) {
        setSources(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch sources:', e);
    }
  };

  const handleStartResearch = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setErrorMsg(null);
    setSubQuestions([]);
    setReport(null);
    setSources([]);
    setStats(null);
    setActiveMainTab('report');
    
    try {
      let res;
      try {
        res = await api.post('/api/research', { query: q });
      } catch (proxyErr) {
        if (!API_BASE_URL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.warn('Vite proxy failed, trying direct localhost:5000:', proxyErr.message);
          res = await axios.post('http://localhost:5000/api/research', { query: q });
        } else {
          throw proxyErr;
        }
      }
      setRunId(res.data.run._id);
      setStatus('pending');
      setProgress(8);
    } catch (err) {
      console.error('Failed to start research:', err);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const serverError = err.response?.data?.error || err.response?.data?.message;
      
      if (serverError) {
        setErrorMsg(`Backend Error: ${serverError}`);
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setErrorMsg('Backend timed out. If your Render backend was asleep, it may take ~45 seconds to wake up on the free tier. Please click Start again in a few moments.');
      } else if (isLocal) {
        setErrorMsg('Could not connect to local backend. Make sure your backend server is running on port 5000 (run `npm start` in backend).');
      } else if (!API_BASE_URL) {
        setErrorMsg(
          'Missing VITE_API_URL: Vercel frontend is not connected to your Render backend. Please set VITE_API_URL in Vercel Settings -> Environment Variables, then Redeploy.'
        );
      } else {
        setErrorMsg(
          `Could not reach backend at ${API_BASE_URL}. Please ensure your Render backend is active and healthy (${err.message || 'Network Error'}).`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Banner & Control Bar */}
      <div className="workspace-header">
        <div className="header-titles">
          <div className="badge-pill bg-primary-soft text-primary">
            <Sparkles size={13} className="icon-mr" />
            Universal Web & Academic Scholar Engine
          </div>
          <h1>Autonomous Deep Research Platform</h1>
          <p className="header-subtitle">
            Searches across the entire global internet and indexes peer-reviewed papers from Google Scholar, arXiv, and Semantic Scholar to synthesize rigorous 2-3 page research reports.
          </p>
        </div>

        {/* Global Live Telemetry if Active */}
        {runId && (
          <div className="header-telemetry-panel">
            <div className="telemetry-item">
              <span className="telemetry-label">Status</span>
              <span className={`telemetry-val ${status === 'completed' ? 'text-success' : 'text-primary'}`}>
                {status === 'completed' ? '✓ Completed' : status ? status.toUpperCase() : 'INITIALIZING'}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Sources Discovered</span>
              <span className="telemetry-val">{stats?.totalSources || sources.length || 0}</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Scholar Literature</span>
              <span className="telemetry-val text-scholar">
                {stats?.scholarSourcesCount || sources.filter(s => ['scholar', 'arxiv', 'academic'].includes(s.sourceType)).length || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="workspace-grid">
        {/* Left Panel: Query Input & Realtime Agent Pipeline */}
        <aside className="left-console">
          {/* Query Launch Box */}
          <div className="console-card query-box-card">
            <h3 className="card-title">
              <Search size={16} className="text-primary icon-mr" />
              Launch Research Investigation
            </h3>

            <form onSubmit={handleStartResearch}>
              <div className="textarea-wrapper">
                <textarea 
                  rows={4}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter any topic, question, or technology (e.g. 'What are the latest breakthroughs in solid-state lithium batteries?')"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleStartResearch(e);
                    }
                  }}
                />
              </div>

              {/* Research Scope & Settings Pill */}
              <div className="scope-pills-row">
                <div className="scope-pill active">
                  <Globe size={13} className="icon-mr text-accent" />
                  <span>All Internet Websites</span>
                </div>
                <div className="scope-pill active scholar-pill">
                  <GraduationCap size={14} className="icon-mr text-scholar" />
                  <span>Google Scholar & arXiv</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-launch" 
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spinner icon-mr" />
                    <span>Initiating Autonomous Swarm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="icon-mr" />
                    <span>Synthesize 2-3 Page Report</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestion Prompts */}
            <div className="suggestions-section">
              <span className="suggestions-title">Trending Inquiries:</span>
              <div className="suggestions-list">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => { setQuery(s); handleStartResearch(null, s); }}
                  >
                    <ArrowRight size={12} className="suggestion-arrow" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="error-banner">
                <AlertCircle size={16} className="icon-mr" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Realtime Pipeline Status Card */}
          {runId && (
            <div className="console-card pipeline-card">
              <div className="pipeline-header">
                <h4 className="pipeline-title">
                  <Terminal size={15} className="text-primary icon-mr" />
                  Autonomous Execution Pipeline
                </h4>
                <span className="progress-counter">{progress}%</span>
              </div>

              <div className="progress-bar-track">
                <div 
                  className="progress-bar-indicator" 
                  style={{ width: `${Math.max(progress, 8)}%` }} 
                />
              </div>

              {/* Pipeline Stage Indicators */}
              <div className="pipeline-stages-list">
                {PIPELINE_STAGES.map((st, idx) => {
                  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === status);
                  const isCurrent = status === st.key;
                  const isDone = stageIndex > idx || status === 'completed';
                  const Icon = st.icon;

                  return (
                    <div 
                      key={st.key} 
                      className={`stage-row ${isCurrent ? 'stage-current' : ''} ${isDone ? 'stage-done' : ''}`}
                    >
                      <div className="stage-icon-circle">
                        <Icon size={13} />
                      </div>
                      <span className="stage-name">{st.label}</span>
                      {isCurrent && <span className="stage-badge-active">Active</span>}
                      {isDone && <CheckCircle2 size={14} className="text-success stage-check" />}
                    </div>
                  );
                })}
              </div>

              {/* Sub-Questions Checklist */}
              {subQuestions.length > 0 && (
                <div className="subquestions-section">
                  <span className="subquestions-title">Sub-Investigations ({subQuestions.length}):</span>
                  <div className="subquestions-list">
                    {subQuestions.map((sq, i) => (
                      <div key={i} className="subquestion-item">
                        <span className="sq-num">{i + 1}</span>
                        <span className="sq-text">{sq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Main Panel: Comprehensive Report & Sources Explorer */}
        <main className="main-content-area">
          {!runId ? (
            <div className="empty-welcome-canvas">
              <div className="welcome-glow-sphere" />
              <div className="welcome-content">
                <div className="welcome-icon-box">
                  <BookOpen size={36} className="text-primary" />
                </div>
                <h2>Autonomous 2-3 Page Evidence Monograph</h2>
                <p>
                  Type any inquiry on the left to start multi-vector search across all internet websites and Google Scholar papers.
                </p>

                <div className="welcome-features-row">
                  <div className="feature-pill">
                    <GraduationCap size={16} className="text-scholar icon-mr" />
                    <span>Google Scholar, arXiv & Semantic Scholar</span>
                  </div>
                  <div className="feature-pill">
                    <Globe size={16} className="text-accent icon-mr" />
                    <span>DuckDuckGo & Live Open Web Scrapers</span>
                  </div>
                  <div className="feature-pill">
                    <FileText size={16} className="text-success icon-mr" />
                    <span>2-3 Pages Publication-Grade Report</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="active-report-workspace">
              {/* Main Workspace Tabs */}
              <div className="workspace-tabs-bar print-hide">
                <div className="main-tabs-group">
                  <button 
                    className={`main-tab-btn ${activeMainTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('report')}
                  >
                    <FileText size={16} className="icon-mr" />
                    <span>2-3 Page Comprehensive Monograph</span>
                  </button>
                  <button 
                    className={`main-tab-btn ${activeMainTab === 'sources' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveMainTab('sources');
                      if (sources.length === 0 && runId) fetchSources(runId);
                    }}
                  >
                    <GraduationCap size={17} className="icon-mr text-scholar" />
                    <span>Harvested Sources ({sources.length || stats?.totalSources || 0})</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Comprehensive Report */}
              {activeMainTab === 'report' && (
                <div className="tab-pane report-pane">
                  {status !== 'completed' && !report ? (
                    <div className="synthesis-loading-state">
                      <div className="pulse-loader-ring" />
                      <h3>Autonomous Agents Ingesting Academic Literature & Web Data...</h3>
                      <p>
                        Harvesting evidence from Google Scholar and global internet sources. Synthesizing full 2-to-3 page publication-grade report.
                      </p>
                      <div className="loading-step-pill">
                        Current Step: <strong>{status ? status.toUpperCase() : 'PROCESSING'}</strong> ({progress}%)
                      </div>
                    </div>
                  ) : (
                    report && (
                      <ReportViewer 
                        report={report} 
                        query={query} 
                        stats={stats} 
                        sources={sources} 
                      />
                    )
                  )}
                </div>
              )}

              {/* Tab 2: Discovered Academic & Web Sources Explorer */}
              {activeMainTab === 'sources' && (
                <div className="tab-pane sources-pane">
                  <SourceList 
                    sources={sources} 
                    loading={status !== 'completed'} 
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
