import React, { useState, useEffect, useRef } from 'react';
import { Wallet, LogOut, Shield, AlertTriangle, Loader2, X, ChevronDown, Copy, Check } from 'lucide-react';
import type { WalletType, WalletState } from '../hooks/useMidnight';

interface WalletConnectProps {
  wallet: WalletState;
  onConnect: (type: WalletType) => Promise<void>;
  onDisconnect: () => void;
}

// ──────────────────────────────────────────
// Official-grade SVG Logos for Midnight Wallets
// ──────────────────────────────────────────
const LaceLogoSVG = ({ size = 28 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      position: 'relative',
      borderRadius: Math.round(size * 0.26),
      overflow: 'hidden',
      flexShrink: 0,
      backgroundColor: '#16161E',
    }}
  >
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <rect width="40" height="40" fill="url(#lace_gradient_bg)" />
      <path d="M20 8.5L31 15V27.5L20 34L9 27.5V15L20 8.5Z" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 14.5L26 18V24.5L20 28L14 24.5V18L20 14.5Z" fill="#FFFFFF" fillOpacity="0.95" />
      <defs>
        <linearGradient id="lace_gradient_bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6D28D9" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
    <img
      src="https://play-lh.googleusercontent.com/YBgKHg8QMINHwb2YWGMELHPzsNJdpOEy5v7xvgPqVu2jQbLpMuH3i_T34fF2p5XvybFBz0_P24_kszaIVOnM=w480-h960-rw"
      alt="Midnight Lace Wallet"
      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
);

const OneAmLogoSVG = ({ size = 28 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      position: 'relative',
      borderRadius: Math.round(size * 0.26),
      overflow: 'hidden',
      flexShrink: 0,
      backgroundColor: '#000000',
    }}
  >
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <rect width="100" height="100" fill="#000000" />
      <circle cx="50" cy="53" r="32" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M50 53L63 12" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="square" />
    </svg>
    <img
      src="https://play-lh.googleusercontent.com/JJHMULcPqbNWyx4IETuNKQFyGmvVyQYVLc_cgt1vi2hBPI8zI4F5swtGCHQLze0du3BxZoO8_fYr9L5gWQq1=w480-h960-rw"
      alt="1AM Wallet"
      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
);

export default function WalletConnect({ wallet, onConnect, onDisconnect }: WalletConnectProps) {
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleConnect = async (type: WalletType) => {
    setError(null);
    setConnectingType(type);
    try {
      await onConnect(type);
      setShowSelector(false);
    } catch (err: any) {
      setError(err?.message || 'Connection failed. Please check your extension.');
    } finally {
      setConnectingType(null);
    }
  };

  const copyAddress = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Connected State (Sleek Navbar Dropdown) ──
  if (wallet.connected) {
    return (
      <div className="wallet-dropdown-container" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="wallet-dropdown-trigger"
          aria-expanded={showDropdown}
        >
          <div className="wallet-status-dot" />
          <div className="wallet-trigger-icon">
            {wallet.walletType === 'lace' ? <LaceLogoSVG size={20} /> : <OneAmLogoSVG size={20} />}
          </div>
          <span className="wallet-connected-label">
            {wallet.walletType === 'lace' ? 'Midnight Lace' : '1AM'} Connected
          </span>
          <ChevronDown size={14} className={`wallet-chevron ${showDropdown ? 'open' : ''}`} />
        </button>

        {showDropdown && (
          <div className="wallet-dropdown-menu">
            <div className="wallet-dropdown-header">
              <div className="wallet-dropdown-badge">
                {wallet.walletType === 'lace' ? <LaceLogoSVG size={36} /> : <OneAmLogoSVG size={36} />}
              </div>
              <div className="wallet-dropdown-meta">
                <div className="wallet-dropdown-title">
                  {wallet.walletType === 'lace' ? 'Midnight Lace Wallet' : '1AM Wallet'}
                </div>
                <div className="wallet-dropdown-net">Preprod Network • ZK Enabled</div>
              </div>
            </div>

            <div className="wallet-dropdown-section">
              <div className="wallet-dropdown-label">Wallet Address</div>
              <div className="wallet-address-box">
                <span className="wallet-dropdown-address-text">
                  {wallet.address.length > 28
                    ? `${wallet.address.slice(0, 16)}...${wallet.address.slice(-10)}`
                    : wallet.address}
                </span>
                <button
                  onClick={copyAddress}
                  className="wallet-copy-btn"
                  title="Copy Shielded Address"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="wallet-dropdown-section">
              <div className="wallet-dropdown-label">ZK Shielded Vault & Funds</div>
              <div className="wallet-funds-box">
                <span className="wallet-funds-status">🟢 Active Shielded Connection</span>
              </div>
            </div>

            <div className="wallet-dropdown-divider" />

            <button
              onClick={() => {
                setShowDropdown(false);
                onDisconnect();
              }}
              className="wallet-dropdown-disconnect"
            >
              <LogOut size={16} />
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Wallet Selector Modal ──
  if (showSelector) {
    return (
      <div className="wallet-selector-overlay">
        <div className="wallet-selector-modal">
          <div className="wallet-selector-header">
            <h3>Connect Wallet</h3>
            <button
              onClick={() => { setShowSelector(false); setError(null); }}
              className="wallet-selector-close"
            >
              <X size={18} />
            </button>
          </div>

          <p className="wallet-selector-description">
            Select a Midnight-compatible ZK wallet to authenticate and interact with TradeSealed on Preprod.
          </p>

          {error && (
            <div className="wallet-error-banner">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="wallet-options">
            <button
              onClick={() => handleConnect('lace')}
              disabled={connectingType !== null}
              className={`wallet-option-card ${connectingType === 'lace' ? 'active-connecting' : ''}`}
            >
              <div className="wallet-option-icon-wrapper">
                <LaceLogoSVG size={36} />
              </div>
              <div className="wallet-option-info">
                <span className="wallet-option-name">Midnight Lace Wallet</span>
                <span className="wallet-option-desc">Official Midnight Preprod ZK Wallet</span>
              </div>
              {connectingType === 'lace' && <Loader2 size={18} className="wallet-spinner" />}
            </button>

            <button
              onClick={() => handleConnect('1am')}
              disabled={connectingType !== null}
              className={`wallet-option-card ${connectingType === '1am' ? 'active-connecting' : ''}`}
            >
              <div className="wallet-option-icon-wrapper">
                <OneAmLogoSVG size={36} />
              </div>
              <div className="wallet-option-info">
                <span className="wallet-option-name">1AM Wallet</span>
                <span className="wallet-option-desc">Midnight ProofStation wallet</span>
              </div>
              {connectingType === '1am' && <Loader2 size={18} className="wallet-spinner" />}
            </button>
          </div>

          <p className="wallet-selector-footer">
            Ensure your wallet extension is set to the <strong>Preprod</strong> network.
          </p>
        </div>
      </div>
    );
  }

  // ── Disconnected Button ──
  return (
    <button
      onClick={() => setShowSelector(true)}
      className="btn btn-primary wallet-connect-btn"
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
}
