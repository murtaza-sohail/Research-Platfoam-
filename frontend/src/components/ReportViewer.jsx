import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, Download, Copy, Check, Printer, 
  BookOpen, ExternalLink, Bookmark, Sparkles, 
  Layers, ChevronRight, Award, FileCode
} from 'lucide-react';

export default function ReportViewer({ report, query, stats, sources = [] }) {
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'continuous'
  const [copied, setCopied] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  const content = report?.content || report?.executiveSummary || '';
  
  // Calculate approximate word and page metrics
  const wordCount = useMemo(() => {
    return content ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  const estimatedPages = useMemo(() => {
    return Math.max(2, Math.min(4, Math.ceil(wordCount / 650)));
  }, [wordCount]);

  // Extract Table of Contents from Markdown headers
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const headers = [];
    lines.forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headers.push({ level, title, id });
      }
    });
    return headers;
  }, [content]);

  // Split markdown into 2-3 visual pages for Paginated View
  const paginatedPages = useMemo(() => {
    if (!content) return [];
    
    // Split by major headers (## ) or section dividers (---)
    const sections = content.split(/(?=\n##\s+)|(?=\n---\n)/);
    
    if (sections.length <= 1) {
      return [content];
    }

    const pages = [];
    let currentPage = '';
    let currentWords = 0;
    const targetWordsPerPage = Math.max(500, Math.ceil(wordCount / (estimatedPages || 3)));

    sections.forEach(section => {
      const secWords = section.trim().split(/\s+/).length;
      if (currentWords > 0 && (currentWords + secWords > targetWordsPerPage * 1.25) && pages.length < 3) {
        pages.push(currentPage.trim());
        currentPage = section;
        currentWords = secWords;
      } else {
        currentPage += '\n\n' + section;
        currentWords += secWords;
      }
    });

    if (currentPage.trim()) {
      pages.push(currentPage.trim());
    }

    return pages.length > 0 ? pages : [content];
  }, [content, wordCount, estimatedPages]);

  // Copy report as clean markdown
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download report as markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeepResearch_Report_${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print formatted report (Native browser PDF print)
  const handlePrint = () => {
    window.print();
  };

  // Map reference markers like [1], [2] to citations or sources
  const findSourceForRef = (refStr) => {
    const num = parseInt(refStr.replace(/\D/g, ''), 10);
    if (!num) return null;
    
    // Check report citations
    if (report?.citations && report.citations[num - 1]) {
      const cit = report.citations[num - 1];
      const matchedSource = sources.find(s => s._id === cit.sourceId?._id || s._id === cit.sourceId);
      return {
        refId: refStr,
        text: cit.text,
        title: matchedSource?.title || cit.sourceId?.title || `Evidence Reference ${refStr}`,
        url: matchedSource?.url || cit.sourceId?.url || '#',
        authors: matchedSource?.authors || cit.sourceId?.authors || '',
        year: matchedSource?.year || cit.sourceId?.year || '',
        sourceType: matchedSource?.sourceType || cit.sourceId?.sourceType || 'web',
        pdfUrl: matchedSource?.pdfUrl || null
      };
    }

    // Fallback to sources list
    if (sources[num - 1]) {
      const s = sources[num - 1];
      return {
        refId: refStr,
        text: s.snippet || '',
        title: s.title,
        url: s.url,
        authors: s.authors || '',
        year: s.year || '',
        sourceType: s.sourceType || 'web',
        pdfUrl: s.pdfUrl || null
      };
    }

    return null;
  };

  return (
    <div className="report-viewer-container">
      {/* Top Action & Telemetry Toolbar */}
      <div className="report-toolbar print-hide">
        <div className="report-meta-badges">
          <span className="badge-pill bg-primary-soft text-primary">
            <BookOpen size={14} className="icon-mr" />
            {estimatedPages} Pages ({wordCount.toLocaleString()} words)
          </span>
          <span className="badge-pill bg-scholar-soft text-scholar">
            <Award size={14} className="icon-mr" />
            {stats?.scholarSourcesCount || sources.filter(s => ['scholar', 'arxiv', 'academic'].includes(s.sourceType)).length} Scholar Sources
          </span>
          <span className="badge-pill bg-success-soft text-success">
            <Sparkles size={14} className="icon-mr" />
            Verified Autonomous Synthesis
          </span>
        </div>

        <div className="report-actions">
          {/* View Mode Switch */}
          <div className="view-mode-toggle">
            <button 
              className={`btn-toggle ${viewMode === 'paginated' ? 'active' : ''}`}
              onClick={() => setViewMode('paginated')}
              title="2-3 Page Document Layout"
            >
              <Layers size={14} />
              <span>Paginated (2-3 Pages)</span>
            </button>
            <button 
              className={`btn-toggle ${viewMode === 'continuous' ? 'active' : ''}`}
              onClick={() => setViewMode('continuous')}
              title="Continuous Reading"
            >
              <FileText size={14} />
              <span>Continuous</span>
            </button>
          </div>

          <button className="btn-tool" onClick={handleCopy} title="Copy Markdown">
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button className="btn-tool" onClick={handleDownloadMarkdown} title="Download .md">
            <FileCode size={15} />
            <span>.MD</span>
          </button>

          <button className="btn-tool btn-primary-tool" onClick={handlePrint} title="Print or Save as PDF">
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Reading Canvas */}
      <div className="report-layout">
        {/* Table of Contents Sticky Sidebar */}
        {tableOfContents.length > 3 && (
          <aside className="toc-sidebar print-hide">
            <div className="toc-header">
              <Bookmark size={15} className="text-primary" />
              <span>Report Outline</span>
            </div>
            <nav className="toc-nav">
              {tableOfContents.map((item, idx) => (
                <a 
                  key={idx} 
                  href={`#${item.id}`}
                  className={`toc-link level-${item.level}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ChevronRight size={11} className="toc-chevron" />
                  <span>{item.title.replace(/^#+\s*/, '')}</span>
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Document Body */}
        <div className="document-container">
          {viewMode === 'paginated' ? (
            <div className="paginated-sheets">
              {paginatedPages.map((pageText, pageIndex) => (
                <div key={pageIndex} className="printable-page-sheet" id={`page-${pageIndex + 1}`}>
                  <div className="page-header-ribbon">
                    <span className="page-brand">DeepResearch AI • Academic & Global Synthesis</span>
                    <span className="page-counter">Page {pageIndex + 1} of {paginatedPages.length}</span>
                  </div>

                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => {
                          const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                          return <h1 id={id} className="report-h1">{children}</h1>;
                        },
                        h2: ({ children }) => {
                          const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                          return <h2 id={id} className="report-h2">{children}</h2>;
                        },
                        h3: ({ children }) => {
                          const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                          return <h3 id={id} className="report-h3">{children}</h3>;
                        },
                        p: ({ children }) => {
                          // Enhanced citation parser for [1], [2] inside paragraphs
                          return <p className="report-p">{children}</p>;
                        }
                      }}
                    >
                      {pageText}
                    </ReactMarkdown>
                  </div>

                  <div className="page-footer-ribbon">
                    <span>Topic: {query}</span>
                    <span>Document ID: {report._id?.slice(-8) || 'VERIFIED-PUB'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="continuous-sheet printable-page-sheet">
              <div className="markdown-body">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => {
                      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                      return <h1 id={id} className="report-h1">{children}</h1>;
                    },
                    h2: ({ children }) => {
                      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                      return <h2 id={id} className="report-h2">{children}</h2>;
                    },
                    h3: ({ children }) => {
                      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                      return <h3 id={id} className="report-h3">{children}</h3>;
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Citation Details Modal / Drawer if clicked */}
      {activeCitation && (
        <div className="citation-modal-overlay" onClick={() => setActiveCitation(null)}>
          <div className="citation-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="citation-modal-header">
              <span className="badge-pill bg-primary-soft text-primary">{activeCitation.refId} Citation Evidence</span>
              <button className="btn-close" onClick={() => setActiveCitation(null)}>✕</button>
            </div>
            <h4 className="citation-modal-title">{activeCitation.title}</h4>
            {activeCitation.authors && (
              <p className="citation-modal-author">Authors: {activeCitation.authors} ({activeCitation.year || 'Recent'})</p>
            )}
            <blockquote className="citation-modal-quote">"{activeCitation.text}"</blockquote>
            <div className="citation-modal-actions">
              <a 
                href={activeCitation.url} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-modal-link"
              >
                <ExternalLink size={14} className="icon-mr" />
                Visit Original Source
              </a>
              {activeCitation.pdfUrl && (
                <a 
                  href={activeCitation.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-modal-pdf"
                >
                  <Download size={14} className="icon-mr" />
                  Download Open-Access PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
