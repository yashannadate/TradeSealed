import React, { useState, useEffect } from 'react';
import * as contractModule from '../../contract/managed/contract/index.js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Transaction } from '@midnight-ntwrk/ledger-v8';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { WalletProvider, MidnightProvider, MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

declare global {
  interface Window {
    midnight?: any;
  }
}

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [connectedWalletApi, setConnectedWalletApi] = useState<any>(null);
  
  const [deploying, setDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [detectedKeys, setDetectedKeys] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[TradeSealed] ${msg}`);
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  useEffect(() => {
    try {
      setNetworkId('preprod');
      addLog('Initialized SDK global NetworkId to "preprod".');
    } catch (e: any) {
      addLog(`Notice setting network ID: ${e.message}`);
    }

    const checkMidnight = () => {
      const obj = window.midnight;
      if (obj) {
        const keys = Array.from(new Set([
          ...Object.keys(obj),
          ...Object.getOwnPropertyNames(obj),
          ...(['1am', 'mnLace', 'lace', 'midnight'].filter(k => obj[k]))
        ])).filter(k => typeof obj[k] === 'object' || typeof obj[k] === 'function');
        setDetectedKeys(keys);
      }
    };
    checkMidnight();
    const interval = setInterval(checkMidnight, 2000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    try {
      addLog('Initiating wallet connection sequence...');
      setNetworkId('preprod');

      const midnightObj = window.midnight;
      if (!midnightObj) {
        const msg = 'No Midnight browser wallet detected (window.midnight is undefined). Please ensure 1AM Wallet or Lace extension is enabled.';
        addLog(`❌ ${msg}`);
        alert(msg);
        return;
      }

      const availableWallets = Array.from(new Set([
        ...Object.keys(midnightObj),
        ...Object.getOwnPropertyNames(midnightObj),
        ...(['1am', 'mnLace', 'lace', 'midnight'].filter(k => midnightObj[k]))
      ])).filter(k => midnightObj[k] && typeof midnightObj[k].connect === 'function');

      addLog(`Valid connector APIs found on window.midnight: ${availableWallets.join(', ') || 'None'}`);

      if (availableWallets.length === 0) {
        const msg = `window.midnight exists, but no wallet implements .connect(). Make sure your 1AM extension is unlocked.`;
        addLog(`❌ ${msg}`);
        alert(msg);
        return;
      }

      const selectedKey = availableWallets.includes('1am') ? '1am' : availableWallets[0];
      const provider = midnightObj[selectedKey];

      addLog(`Calling window.midnight["${selectedKey}"].connect("preprod")...`);
      addLog('👉 PLEASE CHECK YOUR BROWSER EXTENSION ICON OR POPUP WINDOW TO AUTHORIZE CONNECTION!');

      const walletApi = await provider.connect('preprod');
      addLog('Wallet API connected! Requesting shielded addresses...');

      const addresses = await walletApi.getShieldedAddresses();
      
      setConnectedWalletApi(walletApi);
      setWalletName(selectedKey.toUpperCase());
      setWalletAddress(addresses.shieldedAddress);
      setWalletConnected(true);
      
      addLog(`✅ Connected successfully to ${selectedKey.toUpperCase()}! Address: ${addresses.shieldedAddress}`);
      addLog(`Coin Public Key: ${addresses.shieldedCoinPublicKey}`);
    } catch (err: any) {
      addLog(`❌ Wallet connection failed: ${err.message || err}`);
      console.error(err);
      alert(`Connection error: ${err.message || err}`);
    }
  };

  const executeDeploy = async () => {
    if (!connectedWalletApi) {
      alert('Please connect your browser wallet first.');
      return;
    }

    setDeploying(true);
    setContractAddress('');
    setTxHash('');
    
    try {
      setNetworkId('preprod');
      addLog('Initiating TradeSealed browser deployment sequence...');
      addLog('Retrieving shielded cryptographic keys from wallet...');
      
      const { shieldedAddress, shieldedCoinPublicKey, shieldedEncryptionPublicKey } = await connectedWalletApi.getShieldedAddresses();

      const walletProvider: WalletProvider = {
        getCoinPublicKey: () => shieldedCoinPublicKey,
        getEncryptionPublicKey: () => shieldedEncryptionPublicKey,
        async balanceTx(unboundTx: any): Promise<any> {
          addLog('Serializing unsealed deployment transaction...');
          const serializedUint8 = unboundTx.serialize();
          const txHex = Array.from(serializedUint8 as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          
          addLog('Requesting browser wallet to balance transaction & pay fees...');
          addLog('👉 PLEASE AUTHORIZE THE POPUP IN YOUR 1AM WALLET EXTENSION NOW!');
          
          const balanceResult = await connectedWalletApi.balanceUnsealedTransaction(txHex);
          addLog('✅ Transaction balanced successfully by wallet!');
          
          const balancedHex = balanceResult.tx;
          const balancedUint8 = new Uint8Array(
            balancedHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
          );
          
          return Transaction.deserialize(
            'signature',
            'proof',
            'binding',
            balancedUint8
          );
        }
      };

      const midnightProvider: MidnightProvider = {
        async submitTx(finalizedTx: any): Promise<string> {
          addLog('Serializing finalized transaction for broadcast...');
          const serializedUint8 = finalizedTx.serialize();
          const txHex = Array.from(serializedUint8 as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          
          addLog('Broadcasting transaction to Midnight Preprod via wallet relayer...');
          await connectedWalletApi.submitTransaction(txHex);
          
          const txId = finalizedTx.identifiers()[0];
          addLog(`✅ Transaction broadcast confirmed! Tx ID: ${txId}`);
          return txId;
        }
      };

      addLog('Configuring ZK config provider (/managed)...');
      addLog('Connecting to local proof server (http://localhost:6300)...');
      
      const providers: MidnightProviders = {
        privateStateProvider: levelPrivateStateProvider({
          privateStateStoreName: 'tradesealed-browser-deploy',
          accountId: shieldedAddress,
          privateStoragePasswordProvider: () => 'TradeSealed-Browser-Deploy-Secret-2026!@#',
        }),
        publicDataProvider: indexerPublicDataProvider(
          'https://indexer.preprod.midnight.network/api/v1/graphql',
          'wss://indexer.preprod.midnight.network/api/v1/graphql'
        ),
        zkConfigProvider: new FetchZkConfigProvider(window.location.origin + '/managed', window.fetch.bind(window)),
        proofProvider: httpClientProofProvider('http://localhost:6300'),
        walletProvider,
        midnightProvider,
      };

      addLog('Constructing compiled contract object with witnesses...');
      const compiledContract = CompiledContract.make('sealed_bidding', contractModule.Contract).pipe(
        CompiledContract.withWitnesses({
          vendor_qualification_score: () => {
            addLog('[Witness] vendor_qualification_score query answered: 85');
            return 85n;
          },
          bid_price: () => {
            addLog('[Witness] bid_price query answered: 1000');
            return 1000n;
          }
        }),
        CompiledContract.withCompiledFileAssets('/managed')
      );

      addLog('Formatting constructor parameters (authority: Bytes<32>, min_score=75)...');
      const authorityBytes = new Uint8Array(32);
      const sourceBytes = new TextEncoder().encode(shieldedAddress);
      authorityBytes.set(sourceBytes.slice(0, 32));
      const minScore = 75n;

      addLog('Executing deployContract() against sealed_bidding circuit...');
      const deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        privateStateId: 'tradesealed_state',
        initialPrivateState: {},
        args: [authorityBytes, minScore],
      });

      const finalAddress = deployed.deployTxData.public.contractAddress;
      const finalTxId = deployed.deployTxData.public.txId || 'Confirmed via 1AM Relayer';

      setContractAddress(finalAddress);
      setTxHash(finalTxId);
      addLog(`🎉 DEPLOYMENT SUCCESSFUL! Contract Address: ${finalAddress}`);
    } catch (err: any) {
      addLog(`❌ Deployment Error: ${err.message || err}`);
      console.error(err);
      alert(`Deployment failed: ${err.message || err}`);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0E17', color: '#E2E8F0', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        <header style={{ borderBottom: '1px solid #1E293B', paddingBottom: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
              TS
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #6366F1, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TradeSealed — Midnight Deployment Harness
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '14px' }}>
                Official DApp Connector Workflow • Level 1 Submission Verification
              </p>
            </div>
          </div>
        </header>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Extension Status:</strong> {detectedKeys.length > 0 ? `Detected wallets (${detectedKeys.join(', ')})` : 'Scanning window.midnight...'}</span>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>Network ID: preprod</span>
          </div>
        </div>

        <section style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', color: '#F8FAFC' }}>
            Step 1: Connect 1AM Browser Wallet
          </h2>
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              style={{
                backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              Connect 1AM Wallet Extension
            </button>
          ) : (
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                <span style={{ fontWeight: 600, color: '#34D399' }}>Connected to {walletName} Wallet (Preprod)</span>
              </div>
              <div style={{ fontSize: '13px', color: '#CBD5E1', wordBreak: 'break-all' }}>
                <strong>Shielded Address:</strong> {walletAddress}
              </div>
            </div>
          )}
        </section>

        <section style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', color: '#F8FAFC' }}>
            Step 2: Deploy Contract (`sealed_bidding.compact`)
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px' }}>
            Uses local zero-knowledge prover (`http://localhost:6300`), then prompts your 1AM wallet popup to balance fees and submit to Preprod.
          </p>
          
          <button
            onClick={executeDeploy}
            disabled={!walletConnected || deploying}
            style={{
              backgroundColor: !walletConnected || deploying ? '#334155' : '#10B981',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: !walletConnected || deploying ? 'not-allowed' : 'pointer',
              boxShadow: !walletConnected || deploying ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            {deploying ? 'Proving & Deploying Contract...' : 'Deploy Contract to Midnight Preprod'}
          </button>
        </section>

        {contractAddress && (
          <section style={{ backgroundColor: '#064E3B', border: '2px solid #10B981', borderRadius: '16px', padding: '24px', marginBottom: '24px', animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🎉</span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Level 1 Verified Deployment
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '12px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contract Address</span>
                <div style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 600, color: '#FFFFFF', wordBreak: 'break-all', marginTop: '4px' }}>
                  {contractAddress}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction Hash</span>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#D1FAE5', wordBreak: 'break-all', marginTop: '4px' }}>
                  {txHash}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Network & Status</span>
                <div style={{ fontSize: '14px', color: '#34D399', fontWeight: 600, marginTop: '4px' }}>
                  Midnight Preprod • Active & Finalized
                </div>
              </div>
            </div>
          </section>
        )}

        <section style={{ backgroundColor: '#0B0F19', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>
            Deployment Activity Log
          </h3>
          <div style={{ backgroundColor: '#05070D', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', height: '240px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}>
            {logs.length === 0 ? (
              <span style={{ color: '#475569' }}>Ready. Click connect button above...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ color: log.includes('❌') ? '#F87171' : log.includes('🎉') || log.includes('✅') ? '#34D399' : '#94A3B8' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
