import React, { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, List, Briefcase, History, BarChart3, Settings,
  Wallet, Search, Lock, Globe, Shield, Zap, ExternalLink, Activity, Moon,
  Cpu, CheckCircle2, ArrowRight, Menu, X
} from 'lucide-react';
import { useMidnight } from './hooks/useMidnight';
import WalletConnect from './components/WalletConnect';
import CircuitCall from './components/CircuitCall';

// Default preprod contract address from Level 1
const PREPROD_CONTRACT_ADDRESS = '6823a11cd72d4eff83f5b440f4e08f4e94c16d69c679ef63c28a45a8229961ef';

const initialTenders = [
  { id: 'TS-001', title: 'Supply of High-Silicon Solar Cells', org: 'Solaris Energy', status: 'Active', closingDate: '2026-08-15', minScore: 80, budget: '$1,200,000', address: PREPROD_CONTRACT_ADDRESS },
];

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [currentPage, setCurrentPage] = useState<
    'dashboard' | 'circuit' | 'create' | 'active' | 'details' | 'my-bids' | 'contracts' | 'analytics' | 'wallet' | 'explorer' | 'settings'
  >('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const midnight = useMidnight();

  const words = ['Private.', 'Verifiable.', 'Unbiased.'];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out'>('fade-in');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setFadeState('fade-in');
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const [activeSection, setActiveSection] = useState('features');

  // Local UI state
  const [tenders, setTenders] = useState<any[]>(() => {
    const saved = localStorage.getItem('tradesealed_saved_tenders');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const activeAddr = localStorage.getItem('tradesealed_active_contract');
    if (activeAddr && activeAddr !== PREPROD_CONTRACT_ADDRESS) {
      return [
        {
          id: 'TS-002',
          title: 'Smart Contract Deployment RFP',
          org: 'TradeSealed Authority',
          status: 'Active',
          closingDate: '2026-09-30',
          minScore: 80,
          budget: '$2,500,000',
          address: activeAddr,
        },
        ...initialTenders,
      ];
    }
    return initialTenders;
  });
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
      const newTender = {
        id: `TS-00${tenders.length + 1}`,
        title: newTenderTitle || 'New Tender',
        org: newTenderOrg || 'My Corp',
        status: 'Active',
        closingDate: '2026-09-30',
        minScore: parseInt(newTenderMinScore),
        budget: newTenderBudget || '$500,000',
        address: addr,
      };
      const updatedList = [newTender, ...tenders];
      setTenders(updatedList);
      localStorage.setItem('tradesealed_saved_tenders', JSON.stringify(updatedList));
      setSelectedTender(newTender);
      setTargetContractAddress(addr);
      alert(`Contract deployed! Address: ${addr}`);
      setCurrentPage('active');
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
          <div onClick={() => setViewMode('landing')} className="navbar-logo-container">
            <img src="/logo.PNG" alt="TradeSealed" className="navbar-logo-img" />
          </div>
          <nav className="landing-nav">
            <a href="#features" onClick={() => setActiveSection('features')} className={activeSection === 'features' ? 'active' : ''}>Features</a>
            <a href="#privacy" onClick={() => setActiveSection('privacy')} className={activeSection === 'privacy' ? 'active' : ''}>Privacy</a>
            <a href="#security" onClick={() => setActiveSection('security')} className={activeSection === 'security' ? 'active' : ''}>Security</a>
            <a href="#docs" onClick={() => setActiveSection('docs')} className={activeSection === 'docs' ? 'active' : ''}>Docs</a>
          </nav>
          <div className="navbar-actions">
            <WalletConnect
              wallet={midnight.wallet}
              onConnect={midnight.connectWallet}
              onDisconnect={midnight.disconnectWallet}
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle-btn"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <a href="#features" onClick={() => { setActiveSection('features'); setMobileMenuOpen(false); }}>Features</a>
            <a href="#privacy" onClick={() => { setActiveSection('privacy'); setMobileMenuOpen(false); }}>Privacy</a>
            <a href="#security" onClick={() => { setActiveSection('security'); setMobileMenuOpen(false); }}>Security</a>
            <a href="#docs" onClick={() => { setActiveSection('docs'); setMobileMenuOpen(false); }}>Docs</a>
          </div>
        )}

        {/* Hero */}
        <section className="landing-hero">
          <div>
            <h1 className="h1-headline" style={{ marginBottom: '24px' }}>
              Procurement <br />
              that is... <span className={"hero-secondary " + fadeState}>{words[wordIndex]}</span>
            </h1>
            <p className="body-large" style={{ marginBottom: '36px' }}>
              Secure your supply chain. Experience private and audit-ready tender management, verified by <span style={{ color: 'var(--brand-accent)', fontWeight: 600 }}>Zero-Knowledge</span> protocols.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setViewMode('app')} className="btn btn-primary">
                Launch App <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="landing-trust">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <h3 className="landing-trust-title">Trusted Technology</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              <div className="card-block" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Shield size={24} color="var(--brand-accent)" />
                <h4>Midnight Network</h4>
              </div>
              <div className="card-block" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Zap size={24} color="var(--brand-accent)" />
                <h4>Zero Knowledge</h4>
              </div>
              <div className="card-block" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Lock size={24} color="var(--brand-accent)" />
                <h4>Privacy First</h4>
              </div>
              <div className="card-block" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Globe size={24} color="var(--brand-accent)" />
                <h4>Enterprise Ready</h4>
              </div>
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
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Lock size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Confidential Bidding</h3>
              <p className="body-small">Only mathematical proof reaches the blockchain.</p>
            </div>
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Zap size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Zero-Knowledge Verification</h3>
              <p className="body-small">Verify vendor eligibility without revealing private data.</p>
            </div>
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Globe size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Blockchain Transparency</h3>
              <p className="body-small">Tender activity is immutable and auditable.</p>
            </div>
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Briefcase size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Enterprise Ready</h3>
              <p className="body-small">Designed for governments, enterprises, and supply chains.</p>
            </div>
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Wallet size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Multi-Wallet Support</h3>
              <p className="body-small">Connect with Lace or 1AM wallet extensions.</p>
            </div>
            <div className="card-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <BarChart3 size={24} color="var(--brand-accent)" />
              <h3 className="h3-header">Real-Time Analytics</h3>
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
              <h3 className="h3-header" style={{ color: 'var(--brand-accent)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} /> Public State
              </h3>
              <div style={{ display: 'grid', gap: '12px' }} className="body-small">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>Tender Authority Address</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>Minimum Qualification Threshold</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>Total Bids Counter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>Tender Active Status</span>
                </div>
              </div>
            </div>
            <div className="card-block">
              <h3 className="h3-header" style={{ color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} /> Private Witness
              </h3>
              <div style={{ display: 'grid', gap: '12px' }} className="body-small">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                  <span>Bid Price Amount</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                  <span>Qualification Score</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                  <span>Vendor Identity Key</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                  <span>All Witness Inputs</span>
                </div>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built securely on <Shield size={12} style={{ color: 'var(--brand-accent)' }} /> Midnight
          </span>
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
  ] as const;

  return (
    <div className="w-full min-h-screen bg-black flex flex-col m-0 p-0 text-white font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="w-full border-b border-slate-800/60 px-6 bg-black sticky top-0 z-50 h-[72px] flex justify-between items-center">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div className="navbar-logo-container" onClick={() => setViewMode('landing')}>
            <img src="/logo.PNG" className="navbar-logo-img" alt="TradeSealed Logo" />
          </div>

          {/* Horizontal Navigation Menu */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8 h-full">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentPage(item.key as any)}
                className={`dashboard-nav-item ${currentPage === item.key ? 'active' : ''}`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Wallet connection */}
        <div className="flex items-center gap-4">
          <WalletConnect
            wallet={midnight.wallet}
            onConnect={midnight.connectWallet}
            onDisconnect={midnight.disconnectWallet}
          />
        </div>
      </header>

      {/* Mobile Horizontal Navigation Menu (Only shown on mobile) */}
      <div className="md:hidden w-full border-b border-slate-800/60 bg-black px-6 py-2 overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-4 w-full">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key as any)}
              className={`flex-shrink-0 pb-1.5 pt-0.5 border-b-2 font-semibold text-xs transition-all duration-150 ${
                currentPage === item.key
                  ? 'text-white border-[#0000FF]'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Main Content Container ── */}
      <main className="w-full flex-1 p-6 lg:p-8 max-w-full text-white bg-black">

          {/* ── DASHBOARD ── */}
          {currentPage === 'dashboard' && (
            <div className="flex flex-col gap-8 w-full">
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h1>
                  <p className="text-sm text-slate-400">Monitor confidential procurement activity and submit bids securely in real time.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentPage('circuit')} className="bg-[#0000FF] hover:bg-[#0000CC] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                    <Zap size={16} /> Call ZK Circuit
                  </button>
                  <button onClick={() => setCurrentPage('create')} className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                    <PlusCircle size={16} /> Create Tender
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Open Tenders</span>
                  <h3 className="text-4xl font-black text-white">{tenders.length}</h3>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Circuit Status</span>
                  <h3 className="text-lg font-bold text-green-400 mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400"></span>
                    {midnight.circuitResult?.success ? 'Last Call Success' : 'Ready for Proofs'}
                  </h3>
                </div>
              </div>

              {/* Tenders Table */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h3 className="text-lg font-bold text-white">Active RFPs & Opportunities</h3>
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Search tenders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-855 focus:border-[#0000FF] rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 px-4">Tender ID</th>
                        <th className="pb-3 px-4">Title</th>
                        <th className="pb-3 px-4">Organization</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 px-4">Min Score</th>
                        <th className="pb-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30 text-sm">
                      {filteredTenders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">No Active Tenders Found</td>
                        </tr>
                      ) : (
                        filteredTenders.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-[#0000FF]">{t.id}</td>
                            <td className="py-4 px-4 text-white font-medium">{t.title}</td>
                            <td className="py-4 px-4 text-slate-300">{t.org}</td>
                            <td className="py-4 px-4">
                              <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/20">{t.status}</span>
                            </td>
                            <td className="py-4 px-4 text-slate-300">{t.minScore} pts</td>
                            <td className="py-4 px-4">
                              <button onClick={() => { setSelectedTender(t); setCurrentPage('details'); }} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-slate-700">
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
            </div>
          )}

          {/* ── ZK CIRCUIT CALL PAGE ── */}
          {currentPage === 'circuit' && (
            <div className="w-full flex-1">
              <CircuitCall
                wallet={midnight.wallet}
                onCallCircuit={midnight.callCircuit}
                circuitLoading={midnight.circuitLoading}
                circuitResult={midnight.circuitResult}
                logs={midnight.logs}
                contractAddress={selectedTender?.address || midnight.activeContractAddress}
              />
            </div>
          )}

          {/* ── CREATE TENDER ── */}
          {currentPage === 'create' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start">
              
              {/* Left Column: Form */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 xl:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-2">Create a New Tender</h2>
                <p className="text-sm text-slate-400 mb-6">Publish secure procurement requests onto the Midnight Preprod network.</p>
                <form onSubmit={handleDeployTender} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tender Title</label>
                    <input type="text" className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none" placeholder="e.g. Solar Panel Supply RFP" value={newTenderTitle} onChange={(e) => setNewTenderTitle(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization Name</label>
                    <input type="text" className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none" placeholder="e.g. Solaris Energy Corp" value={newTenderOrg} onChange={(e) => setNewTenderOrg(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Range</label>
                    <input type="text" className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none" placeholder="e.g. $1,500,000" value={newTenderBudget} onChange={(e) => setNewTenderBudget(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimum Qualification Score</label>
                    <input type="number" className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none" placeholder="75" value={newTenderMinScore} onChange={(e) => setNewTenderMinScore(e.target.value)} required />
                  </div>
                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/40 pt-4">
                    <button type="button" onClick={() => setCurrentPage('dashboard')} className="bg-transparent hover:bg-slate-800 text-slate-300 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors border border-slate-700">Cancel</button>
                    <button type="submit" disabled={deployInProgress || midnight.deployLoading} className="bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                      {deployInProgress ? 'Deploying to Preprod...' : 'Publish Tender'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Deployment Info Guide */}
              <div className="bg-[#0d0d0d] border border-slate-800/60 rounded-xl p-6 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Smart Contract Deployment</h3>
                  <p className="text-sm text-slate-400">
                    Publishing a tender deploys an independent instance of the <strong>sealed bidding contract</strong> onto the Midnight ledger.
                  </p>
                </div>
                <div className="flex flex-col gap-4 text-xs">
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex gap-2.5">
                    <Shield size={16} className="text-[#0000FF] flex-shrink-0" />
                    <div>
                      <strong className="text-white block mb-1">On-Chain Policy Enforcement</strong>
                      <span className="text-slate-400">The minimum score rules are locked directly in the ledger and automatically verified for all proposals.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex gap-2.5">
                    <Lock size={16} className="text-[#0000FF] flex-shrink-0" />
                    <div>
                      <strong className="text-white block mb-1">Cryptographic Isolation</strong>
                      <span className="text-slate-400">Bids submitted to this contract are evaluated locally in memory. Only verification proofs are sent to this address.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── ACTIVE TENDERS ── */}
          {currentPage === 'active' && (
            <div className="flex flex-col gap-6 w-full">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Active Tenders</h2>
                <p className="text-sm text-slate-400">Browse and manage all currently open procurement requests.</p>
              </div>
              {tenders.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-8 text-center max-w-lg">
                  <h3 className="text-lg font-bold text-white mb-2">No Active Tenders</h3>
                  <p className="text-sm text-slate-400 mb-6">Start by creating your first confidential procurement tender.</p>
                  <button onClick={() => setCurrentPage('create')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">Create Tender</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                  {tenders.map((t) => (
                    <div key={t.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-slate-700 transition-colors">
                      <div>
                        <span className="font-mono text-xs text-blue-400 font-semibold">{t.id}</span>
                        <h3 className="text-xl font-bold text-white mt-1 mb-2">{t.title}</h3>
                        <span className="text-sm text-slate-400 block">{t.org}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-800/40 pt-4 mt-auto">
                        <span className="text-xs text-slate-400">Min Score: <strong className="text-white">{t.minScore} pts</strong></span>
                        <button onClick={() => { setSelectedTender(t); setCurrentPage('details'); }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors">
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
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 w-full">
              <h2 className="text-2xl font-bold text-white mb-2">My Bids</h2>
              <p className="text-sm text-slate-400 mb-6">Track every confidential bid you've submitted via local Zero-Knowledge circuits.</p>
              {midnight.circuitResult?.success ? (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 px-4">Transaction</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 px-4">Privacy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30 text-sm">
                      <tr className="hover:bg-slate-900/20">
                        <td className="py-4 px-4 font-mono text-[#0000FF] break-all">{midnight.circuitResult.txHash}</td>
                        <td className="py-4 px-4">
                          <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/20">Verified</span>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Lock size={12} className="text-[#0000FF]" /> Inputs Hidden
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-bold text-white mb-2">No Bids Submitted Yet</h3>
                  <p className="text-sm text-slate-400 mb-6">Go to Active Tenders, select an RFP, and submit your confidential proposal.</p>
                  <button onClick={() => setCurrentPage('active')} className="bg-[#0000FF] hover:bg-[#0000CC] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">Browse Active Tenders</button>
                </div>
              )}
            </div>
          )}


          {/* ── DETAILS / TENDER SUBMISSION PAGE ── */}
          {currentPage === 'details' && selectedTender && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start">
              
              {/* Left Column: Details */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 xl:col-span-2 flex flex-col gap-6">
                <div>
                  <button onClick={() => setCurrentPage('active')} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-slate-700 mb-4">
                    ← Back to List
                  </button>
                  <span className="font-mono text-xs text-[#0000FF] font-bold block">{selectedTender.id}</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1 mb-2">{selectedTender.title}</h2>
                  <span className="text-sm text-slate-400">{selectedTender.org}</span>
                </div>

                {/* Public State */}
                <div className="border-t border-slate-800/60 pt-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Public State Ledger</h3>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center border-b border-slate-800/30 pb-2">
                      <span className="text-slate-400">Contract Address</span>
                      <span className="font-mono text-[#0000FF] break-all text-right max-w-md">
                        {selectedTender.address || PREPROD_CONTRACT_ADDRESS}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800/30 pb-2">
                      <span className="text-slate-400">Minimum Score Rules</span>
                      <span className="text-white font-semibold">{selectedTender.minScore} pts</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-slate-400">Budget Range</span>
                      <span className="text-white font-semibold">{selectedTender.budget}</span>
                    </div>
                  </div>
                </div>

                {/* ZK Explanation */}
                <div className="bg-slate-950/60 border border-slate-800/50 p-4 rounded-lg flex gap-3 items-start">
                  <Lock size={18} className="text-[#0000FF] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#0000FF] mb-1">Confidential Private Witness</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bid parameters are evaluated inside local client-side memory. The compiled ZK prover verifies mathematical constraints locally without disclosing exact bid price values on-chain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Bid Submission Form */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6 flex flex-col gap-6">
                <h3 className="text-lg font-bold text-white">Submit Confidential ZK Proposal</h3>
                <p className="text-sm text-slate-400">
                  Enter your private parameters to run the prover locally and execute the bid transaction.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Private Bid Price (DUST)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none font-mono"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Private Qualification Score</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0000FF] rounded-lg p-3 text-sm text-white focus:outline-none font-mono"
                      value={bidScore}
                      onChange={(e) => setBidScore(e.target.value)}
                      placeholder="e.g. 85"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const price = BigInt(bidPrice);
                    const score = BigInt(bidScore);
                    await midnight.callCircuit(price, score, selectedTender?.address);
                  }}
                  disabled={!midnight.wallet.connected || midnight.circuitLoading}
                  className="w-full bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold p-3.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {midnight.circuitLoading ? 'Generating ZK Proof...' : 'Generate ZK Proof & Submit Proposal'}
                </button>

                {midnight.circuitResult?.success && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3.5 rounded-lg flex items-center gap-2 text-xs font-semibold justify-center">
                    <Shield size={14} />
                    <span>ZK Proof Verified and Submitted!</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
    </div>
  );
}
