import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, Globe, BookOpen, ExternalLink, 
  Download, Search, Filter, CheckCircle, Clock,
  FileText, Sparkles
} from 'lucide-react';

export default function SourceList({ sources = [], loading = false }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'scholar', 'web'
  const [searchQuery, setSearchQuery] = useState('');

  const scholarSources = useMemo(() => {
    return sources.filter(s => ['scholar', 'arxiv', 'academic'].includes(s.sourceType));
  }, [sources]);

  const webSources = useMemo(() => {
    return sources.filter(s => !['scholar', 'arxiv', 'academic'].includes(s.sourceType));
  }, [sources]);

  const filteredSources = useMemo(() => {
    let list = sources;
    if (activeTab === 'scholar') {
      list = scholarSources;
    } else if (activeTab === 'web') {
      list = webSources;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(s => 
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.authors && s.authors.toLowerCase().includes(q)) ||
      (s.domain && s.domain.toLowerCase().includes(q)) ||
      (s.snippet && s.snippet.toLowerCase().includes(q))
    );
  }, [sources, activeTab, scholarSources, webSources, searchQuery]);

  return (
    <div className="source-list-container">
      {/* Search & Filter Header */}
      <div className="source-list-header">
        <div className="source-tabs">
          <button 
            className={`source-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <BookOpen size={15} className="icon-mr" />
            All Sources ({sources.length})
          </button>
          <button 
            className={`source-tab-btn tab-scholar ${activeTab === 'scholar' ? 'active' : ''}`}
            onClick={() => setActiveTab('scholar')}
          >
            <GraduationCap size={16} className="icon-mr" />
            Google Scholar & Academic ({scholarSources.length})
          </button>
          <button 
            className={`source-tab-btn tab-web ${activeTab === 'web' ? 'active' : ''}`}
            onClick={() => setActiveTab('web')}
          >
            <Globe size={15} className="icon-mr" />
            Global Web ({webSources.length})
          </button>
        </div>

        <div className="source-search-box">
          <Search size={15} className="search-icon" />
          <input 
            type="text"
            placeholder="Search authors, papers, domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      </div>

      {/* Sources Feed / Grid */}
      {filteredSources.length === 0 ? (
        <div className="empty-sources-state">
          <FileText size={36} className="text-secondary" />
          <h4>No sources found</h4>
          <p>
            {sources.length === 0 
              ? 'Sources will appear here in real-time as the agent harvests academic papers and web pages.'
              : 'No sources matched your filter or search criteria.'}
          </p>
        </div>
      ) : (
        <div className="source-cards-grid">
          {filteredSources.map((source, idx) => {
            const isScholar = ['scholar', 'arxiv', 'academic'].includes(source.sourceType);
            const isArxiv = source.sourceType === 'arxiv';
            const isWiki = source.sourceType === 'wikipedia';

            return (
              <div key={source._id || idx} className={`source-card ${isScholar ? 'card-scholar' : 'card-web'}`}>
                <div className="source-card-top">
                  <div className="source-badge-group">
                    {isScholar && (
                      <span className="source-tag tag-scholar">
                        <GraduationCap size={12} className="icon-mr" />
                        {isArxiv ? 'arXiv Preprint' : 'Google Scholar'}
                      </span>
                    )}
                    {isWiki && (
                      <span className="source-tag tag-wiki">
                        <BookOpen size={12} className="icon-mr" />
                        Wikipedia
                      </span>
                    )}
                    {!isScholar && !isWiki && (
                      <span className="source-tag tag-web">
                        <Globe size={12} className="icon-mr" />
                        Web Resource
                      </span>
                    )}

                    {source.year && (
                      <span className="source-tag tag-year">
                        {source.year}
                      </span>
                    )}

                    {source.citationCount > 0 && (
                      <span className="source-tag tag-citations">
                        ★ {source.citationCount} citations
                      </span>
                    )}
                  </div>

                  <span className="source-domain">{source.domain || 'web'}</span>
                </div>

                <h4 className="source-title">
                  <a href={source.url} target="_blank" rel="noreferrer" title="Open source link">
                    {source.title || source.url}
                  </a>
                </h4>

                {source.authors && (
                  <p className="source-authors">
                    <strong>Authors:</strong> {source.authors}
                  </p>
                )}

                {source.snippet && (
                  <p className="source-snippet">
                    {source.snippet}
                  </p>
                )}

                <div className="source-card-footer">
                  <div className="source-status-pill">
                    <CheckCircle size={12} className="text-success icon-mr" />
                    <span>Ingested & Embedded</span>
                  </div>

                  <div className="source-links-group">
                    {source.pdfUrl && (
                      <a 
                        href={source.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-source-pdf"
                        title="Open direct PDF"
                      >
                        <Download size={13} className="icon-mr" />
                        PDF
                      </a>
                    )}
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-source-ext"
                      title="Visit link"
                    >
                      <span>Visit</span>
                      <ExternalLink size={12} className="icon-ml" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
