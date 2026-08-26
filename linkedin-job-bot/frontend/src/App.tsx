import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  User, 
  List, 
  Cpu, 
  Upload, 
  Download, 
  ExternalLink, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Save 
} from 'lucide-react';

interface Application {
  id: number;
  job_id: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  status: string;
  applied_at: string;
  tailored_resume_path: string;
  error_message?: string;
}

interface LearnedQA {
  id: number;
  question_text: string;
  question_options: string[];
  answer: string;
  is_success: number;
  error_feedback?: string;
  updated_at: string;
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  github_url: string;
  base_resume_text: string;
  job_titles: string[];
  target_locations: string[];
  search_keywords: string[];
  custom_answers: Record<string, string>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'applications' | 'learner'>('dashboard');
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [appCount, setAppCount] = useState<number>(0);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ text: string; time: number }[]>([]);
  
  // Profile state
  const [profile, setProfile] = useState<Profile>({
    full_name: '', email: '', phone: '', location: '',
    linkedin_url: '', portfolio_url: '', github_url: '',
    base_resume_text: '', job_titles: [], target_locations: [],
    search_keywords: [], custom_answers: {}
  });
  const [newTitle, setNewTitle] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // Lists
  const [applications, setApplications] = useState<Application[]>([]);
  const [learnedQA, setLearnedQA] = useState<LearnedQA[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Setup WebSockets
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        setBotRunning(data.running);
      } else if (data.type === 'log') {
        setLogs((prev) => [...prev, { text: data.message, time: data.time }]);
      } else if (data.type === 'screenshot') {
        setScreenshotUrl(`http://${window.location.hostname}:8000${data.url}?t=${Date.now()}`);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed. Retrying...');
    };

    // Load initial data
    fetchProfile();
    fetchApplications();
    fetchLearnedQA();
    fetchBotStatus();

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile');
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/applications');
      const data = await res.json();
      setApplications(data);
    } catch (e) {
      console.error('Error fetching applications:', e);
    }
  };

  const fetchLearnedQA = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/learned-qa');
      const data = await res.json();
      setLearnedQA(data);
    } catch (e) {
      console.error('Error fetching Q&As:', e);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/bot/status');
      const data = await res.json();
      setBotRunning(data.running);
      setAppCount(data.application_count);
    } catch (e) {
      console.error('Error fetching bot status:', e);
    }
  };

  const toggleBot = async () => {
    const endpoint = botRunning ? 'stop' : 'start';
    try {
      setLogs([]); // Clear logs on start
      const res = await fetch(`http://127.0.0.1:8000/api/bot/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setBotRunning(!botRunning);
      }
    } catch (e) {
      console.error('Error toggling bot:', e);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingResume(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/upload-resume', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        setProfile(prev => ({
          ...prev,
          base_resume_text: data.text
        }));
        alert('Resume uploaded and parsed successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload and parse resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const saveProfileData = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const addJobTitle = () => {
    if (!newTitle.trim()) return;
    setProfile(prev => ({
      ...prev,
      job_titles: [...prev.job_titles, newTitle.trim()]
    }));
    setNewTitle('');
  };

  const removeJobTitle = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      job_titles: prev.job_titles.filter((_, i) => i !== idx)
    }));
  };

  const addLocation = () => {
    if (!newLoc.trim()) return;
    setProfile(prev => ({
      ...prev,
      target_locations: [...prev.target_locations, newLoc.trim()]
    }));
    setNewLoc('');
  };

  const removeLocation = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      target_locations: prev.target_locations.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateQA = async (qa: LearnedQA, newAnswer: string) => {
    try {
      await fetch('http://127.0.0.1:8000/api/learned-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: qa.question_text,
          options: qa.question_options,
          answer: newAnswer,
          is_success: 1
        })
      });
      fetchLearnedQA();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Cpu size={28} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>LinkedIn Anti-Sniper Auto-Apply Bot</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>V7 AI Engine Loaded</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className={`status-pulse ${botRunning ? 'running' : 'idle'}`}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {botRunning ? 'AUTOMATION ACTIVE' : 'IDLE'}
            </span>
          </div>
          
          <button 
            onClick={toggleBot} 
            className={`btn ${botRunning ? 'btn-danger' : 'btn-primary'}`}
          >
            {botRunning ? (
              <>
                <Square size={16} /> Stop Bot
              </>
            ) : (
              <>
                <Play size={16} /> Run Bot (Fully Auto)
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', margin: '0 1rem 1rem 1rem' }}>
        
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <Cpu size={18} /> Dashboard
          </button>
          
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile Manager
          </button>
          
          <button 
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('applications')}
          >
            <List size={18} /> Applications ({applications.length})
          </button>
          
          <button 
            className={`btn ${activeTab === 'learner' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('learner')}
          >
            <RefreshCw size={18} /> AI Learner ({learnedQA.length})
          </button>
        </aside>

        {/* Tab Contents */}
        <main className="glass-panel" style={{ padding: '2rem', overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
          
          {/* TAB 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%' }}>
              
              {/* Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} style={{ color: 'var(--accent)' }} /> Live Session Logs
                </h3>
                <div style={{ 
                  flex: 1, 
                  background: '#040711', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.85rem',
                  overflowY: 'auto',
                  maxHeight: '450px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {logs.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                      Logs stream will appear here when the bot starts.
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} style={{ 
                        color: log.text.includes('Error') ? 'var(--error)' : 
                               log.text.includes('Success') ? 'var(--success)' : 
                               log.text.includes('Generating') ? 'var(--warning)' : 'var(--text-secondary)'
                      }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                          [{new Date(log.time * 1000).toLocaleTimeString()}]
                        </span>
                        {log.text}
                      </div>
                    ))
                  )}
                  <div ref={logEndRef}></div>
                </div>
              </div>

              {/* Viewport Screenshot */}
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Active Browser Viewport</h3>
                <div style={{ 
                  aspectRatio: '16/10',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {screenshotUrl ? (
                    <img 
                      src={screenshotUrl} 
                      alt="Browser Viewport" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      <AlertCircle size={40} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                      No browser activity. Running the bot will show live screenshot snapshots of the browser.
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Daily Cap: {appCount} / 30 applications</span>
                  <span>Press STOP to force exit at any time.</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Profile Manager */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Configure Profile & Resume</h2>
                <button onClick={saveProfileData} className="btn btn-primary">
                  <Save size={18} /> {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Personal Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="glass-card">
                  <h3>1. Personal Details</h3>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="input-text" 
                      value={profile.full_name} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="input-text" 
                      value={profile.email} 
                      onChange={e => setProfile({...profile, email: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      className="input-text" 
                      value={profile.phone} 
                      onChange={e => setProfile({...profile, phone: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location (City, State)</label>
                    <input 
                      type="text" 
                      className="input-text" 
                      value={profile.location} 
                      onChange={e => setProfile({...profile, location: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input 
                      type="text" 
                      className="input-text" 
                      value={profile.linkedin_url} 
                      onChange={e => setProfile({...profile, linkedin_url: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Search Parameters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="glass-card">
                  <h3>2. Job Target Options</h3>
                  
                  {/* Job Titles list */}
                  <div className="form-group">
                    <label>Target Job Titles</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="input-text" 
                        placeholder="e.g. Software Engineer" 
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                      />
                      <button onClick={addJobTitle} className="btn btn-secondary">+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {profile.job_titles.map((title, idx) => (
                        <span key={idx} style={{ 
                          background: 'rgba(20, 184, 166, 0.1)', 
                          border: '1px solid var(--accent)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {title}
                          <button 
                            onClick={() => removeJobTitle(idx)} 
                            style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Target locations list */}
                  <div className="form-group">
                    <label>Target Locations</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="input-text" 
                        placeholder="e.g. Toronto, Ontario, Canada" 
                        value={newLoc}
                        onChange={e => setNewLoc(e.target.value)}
                      />
                      <button onClick={addLocation} className="btn btn-secondary">+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {profile.target_locations.map((loc, idx) => (
                        <span key={idx} style={{ 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          border: '1px solid var(--info)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {loc}
                          <button 
                            onClick={() => removeLocation(idx)} 
                            style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* PDF Resume Uploader */}
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Base PDF Resume</label>
                    <div style={{ 
                      border: '2px dashed var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '1.5rem', 
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      position: 'relative'
                    }}>
                      <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {uploadingResume ? 'Parsing PDF text using PyPDF...' : 'Drag and drop or click to upload PDF resume'}
                      </p>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleResumeUpload}
                        style={{ 
                          position: 'absolute', 
                          top: 0, left: 0, right: 0, bottom: 0, 
                          opacity: 0, cursor: 'pointer' 
                        }} 
                      />
                    </div>
                    {profile.base_resume_text && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <CheckCircle size={12} /> Base resume text parsed and loaded ({profile.base_resume_text.length} characters)
                      </span>
                    )}
                  </div>

                </div>

              </div>

              {/* Resume Text Preview */}
              <div className="glass-card">
                <h3>Parsed Resume Text Block</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  This base text will be analyzed and rewritten by Gemini AI to perfectly match each job description before exporting to PDF.
                </p>
                <textarea 
                  className="input-textarea"
                  value={profile.base_resume_text}
                  onChange={e => setProfile({...profile, base_resume_text: e.target.value})}
                  style={{ height: '240px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>

            </div>
          )}

          {/* TAB 3: Applications Log */}
          {activeTab === 'applications' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Applications Log</h2>
              
              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                  No applications recorded yet. Let the bot run in full auto mode to build logs.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Applied Date</th>
                      <th style={{ padding: '0.75rem' }}>Job Title</th>
                      <th style={{ padding: '0.75rem' }}>Company</th>
                      <th style={{ padding: '0.75rem' }}>Platform</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Tailored Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(app.applied_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{app.title}</td>
                        <td style={{ padding: '0.75rem' }}>{app.company}</td>
                        <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                          {app.platform.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${app.status === 'applied' ? 'badge-success' : 'badge-error'}`}>
                            {app.status}
                          </span>
                          {app.error_message && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.2rem' }}>
                              {app.error_message}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {app.tailored_resume_path && (
                            <a 
                              href={`http://127.0.0.1:8000/api/applications/download-resume?path=${encodeURIComponent(app.tailored_resume_path)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Download size={12} /> PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: AI Learner Dashboard */}
          {activeTab === 'learner' && (
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Self-Learning QA Store</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                The AI automatically logs form questions it answers. If answers fail validation or are incorrect, edit them here. The bot will automatically learn and use the edited answer the next time it encounters this question.
              </p>
              
              {learnedQA.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                  The AI QA store is empty. As the bot applies to jobs, it will register questions and options here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {learnedQA.map((qa) => (
                    <div key={qa.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Question Label:
                        </span>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{qa.question_text}</strong>
                        
                        {qa.question_options.length > 0 && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Options: {qa.question_options.join(' | ')}
                          </div>
                        )}
                        
                        {qa.error_feedback && (
                          <div style={{ color: 'var(--error)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                            <AlertCircle size={12} /> Validation failure logged: "{qa.error_feedback}"
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Learned Answer</label>
                          {qa.question_options.length > 0 ? (
                            <select 
                              className="input-select"
                              value={qa.answer}
                              onChange={(e) => handleUpdateQA(qa, e.target.value)}
                            >
                              {qa.question_options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="text"
                              className="input-text"
                              value={qa.answer}
                              onChange={(e) => handleUpdateQA(qa, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
