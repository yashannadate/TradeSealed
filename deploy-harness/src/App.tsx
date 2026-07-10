import React, { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, List, Briefcase, History, BarChart3, Settings,
  Wallet, Search, Lock, Globe, Shield, Zap, ExternalLink, Activity, Moon
} from 'lucide-react';
import { useMidnight } from './hooks/useMidnight';
import WalletConnect from './components/WalletConnect';
import CircuitCall from './components/CircuitCall';

// Default preprod contract address from Level 1
const PREPROD_CONTRACT_ADDRESS = '6823a11cd72d4eff83bca90fcf63fb1f737576f3cc9e782e21b745a8229961ef';

const initialTenders = [
  { id: 'TS-001', title: 'Supply of High-Silicon Solar Cells', org: 'Solaris Energy', status: 'Active', closingDate: '2026-08-15', minScore: 80, budget: '$1,200,000' },
];

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [currentPage, setCurrentPage] = useState<
    'dashboard' | 'circuit' | 'create' | 'active' | 'details' | 'my-bids' | 'contracts' | 'analytics' | 'wallet' | 'explorer' | 'settings'
  >('dashboard');

  const midnight = useMidnight();

  // Local UI state
  const [tenders, setTenders] = useState<any[]>(initialTenders);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetContractAddress, setTargetContractAddress] = useState(PREPROD_CONTRACT_ADDRESS);

  // Create tender form
  const [newTenderTitle, setNewTenderTitle] = useState('');
  const [newTenderOrg, setNewTenderOrg] = useState('');
  const [newTenderBudget, setNewTenderBudget] = useState('');
  const [newTenderMinScore, setNewTenderMinScore] = useState('75');

  // Bid form
  const [bidPrice, setBidPrice] = useState('50000');
  const [bidScore, setBidScore] = useState('85');

  // Deploy state
  const [deployInProgress, setDeployInProgress] = useState(false);

  const filteredTenders = tenders.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.org.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeployTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!midnight.wallet.connected) {
      alert('Please connect your wallet first.');
      return;
    }
    setDeployInProgress(true);
    const score = BigInt(newTenderMinScore);
    const addr = await midnight.deployTender(score);
    if (addr) {
      setTenders([
        {
          id: `TS-00${tenders.length + 1}`,
          title: newTenderTitle || 'New Tender',
          org: newTenderOrg || 'My Corp',
          status: 'Active',
          closingDate: '2026-09-30',
          minScore: parseInt(newTenderMinScore),
          budget: newTenderBudget || '$500,000',
        },
        ...tenders,
      ]);
      alert(`Contract deployed! Address: ${addr}`);
      setCurrentPage('dashboard');
    }
    setDeployInProgress(false);
  };

  // ════════════════════════════════════════
  // VIEW 1: Landing Page
  // ════════════════════════════════════════
  if (viewMode === 'landing') {
    return (
      <div style={{ backgroundColor: 'var(--primary-surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <header className="landing-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon">T</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>🛡️ TradeSealed</h2>
          </div>
          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#privacy">Privacy</a>
            <a href="#security">Security</a>
            <a href="#docs">Docs</a>
          </nav>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="network-badge">Preprod</div>
            <WalletConnect
              wallet={midnight.wallet}
              onConnect={midnight.connectWallet}
              onDisconnect={midnight.disconnectWallet}
            />
            <button onClick={() => setViewMode('app')} className="btn btn-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}>
              Launch App
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="landing-hero">
          <div>
            <div className="eyebrow-text" style={{ marginBottom: '24px' }}>
              🟣 Powered by Midnight Network — Level 2
            </div>
            <h1 className="h1-headline" style={{ marginBottom: '24px' }}>
              Confidential Procurement, Built&nbsp;for&nbsp;the&nbsp;Future.
            </h1>
            <p className="body-large" style={{ marginBottom: '36px' }}>
              Create confidential tenders, receive sealed bids, and verify every transaction with
              Zero-Knowledge technology — without exposing sensitive pricing or vendor information.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setViewMode('app')} className="btn btn-primary">🚀 Launch App</button>
              <button onClick={() => setViewMode('app')} className="btn btn-secondary">▶ Watch Demo</button>
            </div>
          </div>

          <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow-text">Active Tender</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>● Live</span>
            </div>
            <div style={{ display: 'grid', gap: '12px' }} className="body-small">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Wallet Connected</span>
                <span style={{ color: midnight.wallet.connected ? 'var(--brand-accent)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {midnight.wallet.connected ? 'Active' : 'Not Connected'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Circuit Calls</span>
                <span style={{ color: 'var(--brand-accent)', fontWeight: 700 }}>Ready</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Contract Deployed</span>
                <span style={{ color: 'var(--brand-accent)', fontWeight: 700 }}>Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="landing-trust">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <h3 className="landing-trust-title">Trusted Technology</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              <div className="card-block" style={{ textAlign: 'center' }}><h4>🛡 Midnight Network</h4></div>
              <div className="card-block" style={{ textAlign: 'center' }}><h4>⚡ Zero Knowledge</h4></div>
              <div className="card-block" style={{ textAlign: 'center' }}><h4>🔐 Privacy First</h4></div>
              <div className="card-block" style={{ textAlign: 'center' }}><h4>🏛 Enterprise Ready</h4></div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="h2-header" style={{ marginBottom: '12px' }}>Why TradeSealed?</h2>
            <p className="body-large">Every bid stays private. Every contract stays verifiable.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>🔒 Confidential Bidding</h3>
              <p className="body-small">Only mathematical proof reaches the blockchain.</p>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>⚡ Zero-Knowledge Verification</h3>
              <p className="body-small">Verify vendor eligibility without revealing private data.</p>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>🌐 Blockchain Transparency</h3>
              <p className="body-small">Tender activity is immutable and auditable.</p>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>🏢 Enterprise Ready</h3>
              <p className="body-small">Designed for governments, enterprises, and supply chains.</p>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>🔑 Multi-Wallet Support</h3>
              <p className="body-small">Connect with Lace or 1AM wallet extensions.</p>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ marginBottom: '12px' }}>📊 Real-Time Analytics</h3>
              <p className="body-small">Track procurement activity with live dashboards.</p>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="h2-header" style={{ marginBottom: '12px' }}>Privacy by Design</h2>
            <p className="body-large">TradeSealed separates public blockchain state from confidential witness data.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div className="card-block">
              <h3 className="h3-header" style={{ color: 'var(--brand-accent)', marginBottom: '20px' }}>Public State</h3>
              <div style={{ display: 'grid', gap: '12px' }} className="body-small">
                <div>✔ Tender Authority Address</div>
                <div>✔ Minimum Qualification Threshold</div>
                <div>✔ Total Bids Counter</div>
                <div>✔ Tender Active Status</div>
              </div>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Private Witness</h3>
              <div style={{ display: 'grid', gap: '12px' }} className="body-small">
                <div>🔒 Bid Price Amount</div>
                <div>🔒 Qualification Score</div>
                <div>🔒 Vendor Identity Key</div>
                <div>🔒 All Witness Inputs</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '100px 40px', textAlign: 'center', borderTop: '1px solid var(--muted-border)' }}>
          <h2 className="h2-header" style={{ marginBottom: '16px' }}>Ready to Modernize Procurement?</h2>
          <p className="body-large" style={{ marginBottom: '32px' }}>
            Experience confidential procurement powered by Midnight Zero-Knowledge technology.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => setViewMode('app')} className="btn btn-primary">Launch App</button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>TradeSealed</span>
            <p style={{ marginTop: '8px' }} className="body-xs">Confidential B2B procurement auctions.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="https://github.com/yashannadate/TradeSealed" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
            <a href="#privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          </div>
          <span>Built with ❤️ on Midnight</span>
        </footer>
      </div>
    );
  }

  // ════════════════════════════════════════
  // VIEW 2: Dashboard Application
  // ════════════════════════════════════════
  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'circuit', label: 'Circuit Call', icon: <Zap size={18} /> },
    { key: 'create', label: 'Create Tender', icon: <PlusCircle size={18} /> },
    { key: 'active', label: 'Active Tenders', icon: <List size={18} /> },
    { key: 'my-bids', label: 'Bid History', icon: <Briefcase size={18} /> },
    { key: 'contracts', label: 'Contracts', icon: <History size={18} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { key: 'explorer', label: 'Explorer', icon: <Globe size={18} /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ] as const;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--primary-surface)' }}>

      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div onClick={() => setViewMode('landing')} className="sidebar-brand">
          <div className="brand-icon">T</div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>TradeSealed</h2>
            <span className="body-xs">Return Home &rarr;</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key as any)}
              className={`sidebar-link ${currentPage === item.key ? 'sidebar-link-active' : ''}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top Bar */}
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="eyebrow-text">Preprod Network</span>
            <span className="network-badge" style={{ fontSize: '10px' }}>Level 2</span>
          </div>
          <WalletConnect
            wallet={midnight.wallet}
            onConnect={midnight.connectWallet}
            onDisconnect={midnight.disconnectWallet}
          />
        </header>

        {/* Content Router */}
        <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>

          {/* ── DASHBOARD ── */}
          {currentPage === 'dashboard' && (
            <div style={{ display: 'grid', gap: '40px' }}>
              <div className="card-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 className="h2-header" style={{ marginBottom: '8px' }}>Welcome Back</h1>
                  <p className="body-regular">Monitor confidential procurement activity in real time.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setCurrentPage('circuit')} className="btn btn-primary">
                    <Zap size={16} /> Call Circuit
                  </button>
                  <button onClick={() => setCurrentPage('create')} className="btn btn-secondary">
                    <PlusCircle size={16} /> Create Tender
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="card-block">
                  <span className="body-xs">Wallet Status</span>
                  <h3 className="body-small" style={{ marginTop: '8px', color: midnight.wallet.connected ? 'var(--brand-accent)' : 'var(--destructive)' }}>
                    {midnight.wallet.connected
                      ? `${midnight.wallet.walletType === 'lace' ? 'Lace' : '1AM'} Connected`
                      : 'Not Connected'
                    }
                  </h3>
                </div>
                <div className="card-block">
                  <span className="body-xs">Open Tenders</span>
                  <h3 className="h3-header" style={{ marginTop: '8px' }}>{tenders.length}</h3>
                </div>
                <div className="card-block">
                  <span className="body-xs">Circuit Status</span>
                  <h3 className="body-small" style={{ marginTop: '8px', color: 'var(--brand-accent)' }}>
                    {midnight.circuitResult?.success ? 'Last Call Success' : 'Ready'}
                  </h3>
                </div>
                <div className="card-block">
                  <span className="body-xs">Contract Network</span>
                  <h3 className="body-small" style={{ marginTop: '8px' }}>Midnight Preprod</h3>
                </div>
              </div>

              {/* Tenders Table */}
              <div className="card-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 className="h3-header">Active RFPs & Opportunities</h3>
                  <div style={{ position: 'relative', width: '300px' }}>
                    <input
                      type="text"
                      placeholder="Search tenders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tender ID</th>
                      <th>Title</th>
                      <th>Organization</th>
                      <th>Status</th>
                      <th>Min Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenders.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No Active Tenders</td></tr>
                    ) : (
                      filteredTenders.map((t) => (
                        <tr key={t.id}>
                          <td className="tech-mono" style={{ fontWeight: 600 }}>{t.id}</td>
                          <td>{t.title}</td>
                          <td>{t.org}</td>
                          <td>
                            <span className="status-badge">{t.status}</span>
                          </td>
                          <td>{t.minScore} pts</td>
                          <td>
                            <button onClick={() => { setSelectedTender(t); setCurrentPage('details'); }} className="btn btn-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CIRCUIT CALL PAGE ── */}
          {currentPage === 'circuit' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <CircuitCall
                wallet={midnight.wallet}
                onCallCircuit={midnight.callCircuit}
                circuitLoading={midnight.circuitLoading}
                circuitResult={midnight.circuitResult}
                logs={midnight.logs}
              />
            </div>
          )}

          {/* ── CREATE TENDER ── */}
          {currentPage === 'create' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="card-block">
                <h2 className="h2-header" style={{ marginBottom: '8px' }}>Create a New Tender</h2>
                <p className="body-regular" style={{ marginBottom: '32px' }}>Publish procurement opportunities securely on Midnight.</p>
                <form onSubmit={handleDeployTender} style={{ display: 'grid', gap: '24px' }}>
                  <div>
                    <label className="form-label">Tender Title</label>
                    <input type="text" className="form-input" placeholder="Solar Cell Supply RFP" value={newTenderTitle} onChange={(e) => setNewTenderTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Organization Name</label>
                    <input type="text" className="form-input" placeholder="Solaris Energy" value={newTenderOrg} onChange={(e) => setNewTenderOrg(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Budget Range</label>
                    <input type="text" className="form-input" placeholder="$1,500,000" value={newTenderBudget} onChange={(e) => setNewTenderBudget(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Minimum Qualification Score</label>
                    <input type="number" className="form-input" placeholder="75" value={newTenderMinScore} onChange={(e) => setNewTenderMinScore(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={() => setCurrentPage('dashboard')} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={deployInProgress || midnight.deployLoading} className="btn btn-primary">
                      {deployInProgress ? 'Deploying...' : 'Publish Tender'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── ACTIVE TENDERS ── */}
          {currentPage === 'active' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <h2 className="h2-header">Active Tenders</h2>
                <p className="body-regular">Browse and manage all currently open procurement requests.</p>
              </div>
              {tenders.length === 0 ? (
                <div className="card-block" style={{ textAlign: 'center' }}>
                  <h3 className="h3-header" style={{ marginBottom: '8px' }}>No Active Tenders</h3>
                  <p className="body-small" style={{ marginBottom: '20px' }}>Start by creating your first confidential procurement tender.</p>
                  <button onClick={() => setCurrentPage('create')} className="btn btn-primary">Create Tender</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  {tenders.map((t) => (
                    <div key={t.id} className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <span className="tech-mono" style={{ fontSize: '11px', color: 'var(--brand-accent)' }}>{t.id}</span>
                        <h3 className="h3-header" style={{ marginTop: '4px' }}>{t.title}</h3>
                        <span className="body-small">{t.org}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Min score: {t.minScore} pts</span>
                        <button onClick={() => { setSelectedTender(t); setCurrentPage('details'); }} className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BID HISTORY ── */}
          {currentPage === 'my-bids' && (
            <div className="card-block">
              <h2 className="h2-header" style={{ marginBottom: '8px' }}>My Bids</h2>
              <p className="body-regular" style={{ marginBottom: '32px' }}>Track every confidential bid you've submitted via the circuit.</p>
              {midnight.circuitResult?.success ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Status</th>
                      <th>Privacy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tech-mono">{midnight.circuitResult.txHash}</td>
                      <td><span className="status-badge">Verified</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Lock size={12} /> Inputs Hidden
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <h3 className="h3-header" style={{ marginBottom: '8px' }}>No Bids Submitted</h3>
                  <p className="body-small" style={{ marginBottom: '20px' }}>Use the Circuit Call page to submit your first confidential bid.</p>
                  <button onClick={() => setCurrentPage('circuit')} className="btn btn-primary">Go to Circuit Call</button>
                </div>
              )}
            </div>
          )}

          {/* ── CONTRACTS ── */}
          {currentPage === 'contracts' && (
            <div className="card-block">
              <h2 className="h2-header" style={{ marginBottom: '8px' }}>Deployed Contracts</h2>
              <p className="body-regular" style={{ marginBottom: '32px' }}>Review deployment records on Midnight Preprod.</p>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Contract Address</th>
                    <th>Network</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="tech-mono" style={{ fontSize: '12px' }}>{PREPROD_CONTRACT_ADDRESS}</td>
                    <td>Preprod</td>
                    <td><span className="status-badge">Deployed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {currentPage === 'analytics' && (
            <div style={{ display: 'grid', gap: '32px' }}>
              <div>
                <h2 className="h2-header">Procurement Analytics</h2>
                <p className="body-regular">Gain insights into tender performance and bidding trends.</p>
              </div>
              <div className="card-block" style={{ textAlign: 'center' }}>
                <h3 className="h3-header" style={{ marginBottom: '20px' }}>Active Prover Statistics</h3>
                <span className="body-small">Prover validation active. No data leaks recorded.</span>
              </div>
            </div>
          )}

          {/* ── WALLET PAGE ── */}
          {currentPage === 'wallet' && (
            <div className="card-block" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <Wallet size={48} color="var(--brand-accent)" style={{ display: 'block', margin: '0 auto 24px' }} />
              <h2 className="h2-header" style={{ marginBottom: '16px' }}>Wallet Management</h2>

              {!midnight.wallet.connected ? (
                <div>
                  <p className="body-regular" style={{ marginBottom: '32px' }}>
                    Connect your Lace or 1AM Wallet to start using TradeSealed.
                  </p>
                  <WalletConnect
                    wallet={midnight.wallet}
                    onConnect={midnight.connectWallet}
                    onDisconnect={midnight.disconnectWallet}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ background: 'var(--secondary-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--muted-border)', marginBottom: '20px' }}>
                    <span style={{ color: 'var(--brand-accent)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      {midnight.wallet.walletType === 'lace' ? 'Lace' : '1AM'} Wallet Connected
                    </span>
                    <span className="tech-mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                      {midnight.wallet.address}
                    </span>
                  </div>
                  <WalletConnect
                    wallet={midnight.wallet}
                    onConnect={midnight.connectWallet}
                    onDisconnect={midnight.disconnectWallet}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── EXPLORER ── */}
          {currentPage === 'explorer' && (
            <div className="card-block">
              <h2 className="h2-header" style={{ marginBottom: '8px' }}>Blockchain Explorer</h2>
              <p className="body-regular" style={{ marginBottom: '32px' }}>View deployed contracts and verified transactions.</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter contract address..."
                  value={targetContractAddress}
                  onChange={(e) => setTargetContractAddress(e.target.value)}
                />
                <button onClick={() => midnight.queryLedger(targetContractAddress)} disabled={midnight.ledgerLoading} className="btn btn-primary" style={{ height: '48px' }}>
                  {midnight.ledgerLoading ? 'Querying...' : 'Search Ledger'}
                </button>
              </div>
              {midnight.ledgerState && (
                <div style={{ background: 'var(--secondary-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--muted-border)', display: 'grid', gap: '12px' }} className="body-small">
                  <div>
                    <span className="eyebrow-text" style={{ display: 'block', marginBottom: '4px' }}>TENDER AUTHORITY</span>
                    <span className="tech-mono">{midnight.ledgerState.tender_authority}</span>
                  </div>
                  <div>
                    <span className="eyebrow-text" style={{ display: 'block', marginBottom: '4px' }}>MIN SCORE RULES</span>
                    <span>{midnight.ledgerState.minimum_qualification_score} pts</span>
                  </div>
                  <div>
                    <span className="eyebrow-text" style={{ display: 'block', marginBottom: '4px' }}>TOTAL SUBMISSIONS</span>
                    <span>{midnight.ledgerState.bids_count} bids</span>
                  </div>
                  <div>
                    <span className="eyebrow-text" style={{ display: 'block', marginBottom: '4px' }}>TENDER STATUS</span>
                    <span>{midnight.ledgerState.is_active ? 'Active' : 'Closed'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {currentPage === 'settings' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="card-block">
                <h2 className="h2-header" style={{ marginBottom: '8px' }}>Settings</h2>
                <p className="body-regular" style={{ marginBottom: '32px' }}>Manage your account, wallet, network, and preferences.</p>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label className="form-label">Indexer Endpoint</label>
                    <input type="text" className="form-input" value="https://indexer.preprod.midnight.network/api/v1/graphql" disabled />
                  </div>
                  <div>
                    <label className="form-label">Proof Server</label>
                    <input type="text" className="form-input" value="http://localhost:6300" disabled />
                  </div>
                  <div>
                    <label className="form-label">Contract Address</label>
                    <input type="text" className="form-input" value={PREPROD_CONTRACT_ADDRESS} disabled />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TENDER DETAILS + BID SUBMISSION ── */}
          {currentPage === 'details' && selectedTender && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div className="card-block">
                  <button onClick={() => setCurrentPage('active')} className="btn btn-secondary" style={{ height: '36px', padding: '0 12px', fontSize: '12px', marginBottom: '20px' }}>
                    ← Back to List
                  </button>
                  <span className="tech-mono" style={{ fontSize: '12px', color: 'var(--brand-accent)', fontWeight: 600 }}>{selectedTender.id}</span>
                  <h2 className="h2-header" style={{ marginTop: '4px', marginBottom: '8px' }}>{selectedTender.title}</h2>
                  <span className="body-small" style={{ display: 'block', marginBottom: '24px' }}>{selectedTender.org}</span>

                  {/* Public State */}
                  <div style={{ borderTop: '1px solid var(--muted-border)', paddingTop: '24px', marginBottom: '32px' }}>
                    <h3 className="eyebrow-text" style={{ marginBottom: '16px' }}>Public State Ledger</h3>
                    <div style={{ display: 'grid', gap: '12px' }} className="body-small">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Contract Address</span>
                        <span className="tech-mono" style={{ fontSize: '11px' }}>{PREPROD_CONTRACT_ADDRESS.slice(0, 20)}...</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Minimum Score Rules</span>
                        <span>{selectedTender.minScore} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Private Witness Info */}
                  <div style={{ background: 'var(--secondary-surface)', border: '1px solid var(--muted-border)', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Lock size={18} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-accent)', marginBottom: '4px' }}>Confidential Private Witness</h4>
                        <p className="body-xs">
                          Bid parameters are parsed locally inside private client memory. Midnight's ZK engine verifies mathematical validity without revealing values.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Circuit Call for this tender */}
                <div className="card-block">
                  <h3 className="h3-header" style={{ marginBottom: '20px' }}>Submit Confidential ZK Proposal</h3>
                  <p className="body-small" style={{ marginBottom: '20px' }}>
                    Clicking below will generate a Zero-Knowledge proof locally. Your private bid price and qualification score <strong>never leave your browser</strong>.
                  </p>
                  <button
                    onClick={async () => {
                      const price = BigInt(bidPrice);
                      const score = BigInt(bidScore);
                      await midnight.callCircuit(price, score);
                    }}
                    disabled={!midnight.wallet.connected || midnight.circuitLoading}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    {midnight.circuitLoading ? 'Generating ZK Proof...' : 'Generate ZK Proof & Submit Proposal'}
                  </button>

                  {midnight.circuitResult?.success && (
                    <div className="circuit-proved-label" style={{ marginTop: '16px' }}>
                      <Shield size={14} />
                      <span>Proved without revealing your input</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ZK Prover Feed */}
              <div className="card-block" style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="eyebrow-text">ZK Prover Feed</h3>
                  {midnight.circuitLoading && <span className="circuit-prover-live">● LIVE</span>}
                </div>
                <div style={{ flex: 1, backgroundColor: 'var(--primary-surface)', borderRadius: '8px', border: '1px solid var(--muted-border)', padding: '16px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}>
                  {midnight.logs.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)' }}>Prover idle. Submitting a bid will stream ZK proving outputs here...</span>
                  ) : (
                    midnight.logs.map((log, idx) => (
                      <div key={idx} style={{ color: log.includes('❌') ? 'var(--destructive)' : log.includes('🎉') || log.includes('✅') ? 'var(--brand-accent)' : 'var(--text-secondary)', marginBottom: '8px', wordBreak: 'break-all' }}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
