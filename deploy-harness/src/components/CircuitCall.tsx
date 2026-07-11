import React, { useState } from 'react';
import { Zap, Shield, Lock, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Activity } from 'lucide-react';
import type { CircuitResult, WalletState } from '../hooks/useMidnight';

interface CircuitCallProps {
  wallet: WalletState;
  onCallCircuit: (price: bigint, score: bigint, targetContractAddress?: string) => Promise<CircuitResult>;
  circuitLoading: boolean;
  circuitResult: CircuitResult | null;
  logs: string[];
  contractAddress?: string;
}

export default function CircuitCall({
  wallet,
  onCallCircuit,
  circuitLoading,
  circuitResult,
  logs,
  contractAddress,
}: CircuitCallProps) {
  const [price, setPrice] = useState('50000');
  const [score, setScore] = useState('85');

  const handleSubmit = async () => {
    if (!wallet.connected) return;
    try {
      const priceVal = BigInt(price);
      const scoreVal = BigInt(score);
      await onCallCircuit(priceVal, scoreVal, contractAddress);
    } catch (e) {
      alert("Invalid price or score value");
    }
  };

  return (
    <div className="circuit-call-container">
      {/* Header */}
      <div className="circuit-header">
        <div className="circuit-header-left">
          <Zap size={20} className="circuit-icon" />
          <div>
            <h3 className="h3-header">Zero-Knowledge Circuit Execution</h3>
            <p className="body-small">
              Call the <code className="tech-mono">submit_bid()</code> circuit on contract <code className="tech-mono" style={{ color: 'var(--brand-accent)' }}>{(contractAddress || 'Preprod Contract').slice(0, 24)}...</code>
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Explanation */}
      <div className="circuit-privacy-box">
        <Shield size={16} className="circuit-privacy-icon" />
        <div>
          <strong>Privacy Guarantee</strong>
          <p className="body-xs" style={{ marginTop: '4px' }}>
            When you click the button below, a Zero-Knowledge proof is generated <em>locally in your browser</em>.
            The proof mathematically verifies that your bid price is greater than zero and your qualification score
            meets the minimum threshold — <strong>without ever revealing the actual values</strong>.
          </p>
        </div>
      </div>

      {/* What is Public vs Private */}
      <div className="circuit-comparison">
        <div className="circuit-comparison-col circuit-public">
          <div className="circuit-comparison-header">
            <Eye size={14} />
            <span>PUBLIC (On-Chain)</span>
          </div>
          <ul className="circuit-comparison-list">
            <li>✓ Tender is active</li>
            <li>✓ A valid bid was submitted</li>
            <li>✓ Bids counter incremented</li>
            <li>✓ ZK proof verified</li>
          </ul>
        </div>
        <div className="circuit-comparison-col circuit-private">
          <div className="circuit-comparison-header">
            <EyeOff size={14} />
            <span>PRIVATE (Never Revealed)</span>
          </div>
          <ul className="circuit-comparison-list">
            <li><Lock size={10} /> Your bid price amount</li>
            <li><Lock size={10} /> Your qualification score</li>
            <li><Lock size={10} /> Your vendor identity</li>
            <li><Lock size={10} /> Your witness inputs</li>
          </ul>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Private Bid Price (DUST)</label>
          <input
            type="number"
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-white focus:outline-none font-mono"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 50000"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Private Qualification Score</label>
          <input
            type="number"
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-white focus:outline-none font-mono"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 85"
          />
        </div>
      </div>

      {/* Call Button */}
      <button
        onClick={handleSubmit}
        disabled={!wallet.connected || circuitLoading}
        className="btn btn-primary circuit-call-btn"
      >
        {circuitLoading ? (
          <>
            <Loader2 size={18} className="wallet-spinner" />
            Generating ZK Proof...
          </>
        ) : (
          <>
            <Zap size={18} />
            Call Circuit — Submit Sealed Bid
          </>
        )}
      </button>

      {!wallet.connected && (
        <p className="body-xs circuit-connect-hint">
          Connect your wallet above to enable circuit execution.
        </p>
      )}

      {/* Result Display */}
      {circuitResult && (
        <div className={`circuit-result ${circuitResult.success ? 'circuit-result-success' : 'circuit-result-error'}`}>
          <div className="circuit-result-header">
            {circuitResult.success ? (
              <CheckCircle2 size={20} className="circuit-result-icon-success" />
            ) : (
              <XCircle size={20} className="circuit-result-icon-error" />
            )}
            <span className="circuit-result-title">
              {circuitResult.success ? 'Proof Verified On-Chain' : 'Circuit Call Failed'}
            </span>
          </div>

          <p className="body-small" style={{ marginTop: '8px' }}>
            {circuitResult.message}
          </p>

          {circuitResult.success && circuitResult.txHash && (
            <div className="circuit-result-details">
              <div className="circuit-result-row">
                <span className="eyebrow-text">TRANSACTION</span>
                <span className="tech-mono">{circuitResult.txHash}</span>
              </div>
              <div className="circuit-result-row">
                <span className="eyebrow-text">TIMESTAMP</span>
                <span className="tech-mono">{circuitResult.timestamp}</span>
              </div>
            </div>
          )}

          {circuitResult.success && (
            <div className="circuit-proved-label">
              <Shield size={14} />
              <span>Proved without revealing your input</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
