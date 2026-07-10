import React, { useState } from 'react';
import { Wallet, LogOut, Shield, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import type { WalletType, WalletState } from '../hooks/useMidnight';

interface WalletConnectProps {
  wallet: WalletState;
  onConnect: (type: WalletType) => Promise<void>;
  onDisconnect: () => void;
}

export default function WalletConnect({ wallet, onConnect, onDisconnect }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const handleConnect = async (type: WalletType) => {
    setError(null);
    setConnecting(true);
    try {
      await onConnect(type);
      setShowSelector(false);
    } catch (err: any) {
      setError(err?.message || 'Connection failed. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  // ── Connected State ──
  if (wallet.connected) {
    return (
      <div className="wallet-connected-card">
        <div className="wallet-connected-header">
          <div className="wallet-status-dot" />
          <span className="wallet-connected-label">
            {wallet.walletType === 'lace' ? 'Lace' : '1AM'} Wallet Connected
          </span>
        </div>

        <div className="wallet-address-display">
          <Shield size={14} className="wallet-address-icon" />
          <span className="tech-mono wallet-address-text">
            {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
          </span>
        </div>

        <button
          onClick={onDisconnect}
          className="btn-disconnect"
          title="Disconnect wallet"
        >
          <LogOut size={14} />
          Disconnect
        </button>
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
            Select a Midnight-compatible wallet to authenticate and interact with TradeSealed on Preprod.
          </p>

          {error && (
            <div className="wallet-error-banner">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="wallet-options">
            <button
              onClick={() => handleConnect('lace')}
              disabled={connecting}
              className="wallet-option-card"
            >
              <div className="wallet-option-icon wallet-option-lace">L</div>
              <div className="wallet-option-info">
                <span className="wallet-option-name">Lace Wallet</span>
                <span className="wallet-option-desc">Official Cardano/Midnight wallet</span>
              </div>
              {connecting && <Loader2 size={18} className="wallet-spinner" />}
            </button>

            <button
              onClick={() => handleConnect('1am')}
              disabled={connecting}
              className="wallet-option-card"
            >
              <div className="wallet-option-icon wallet-option-1am">1</div>
              <div className="wallet-option-info">
                <span className="wallet-option-name">1AM Wallet</span>
                <span className="wallet-option-desc">Midnight ProofStation wallet</span>
              </div>
              {connecting && <Loader2 size={18} className="wallet-spinner" />}
            </button>
          </div>

          <p className="wallet-selector-footer">
            Ensure your wallet extension is set to the <strong>Preprod</strong> network.
          </p>
        </div>
      </div>
    );
  }

  // ── Disconnected State ──
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
