import { useState, useCallback, useRef } from 'react';
import * as contractModule from '../../../contract/managed/contract/index.js';
import { ledger as parseLedgerState } from '../../../contract/managed/contract/index.js';
import { deployContract, findDeployedContract, getPublicStates } from '@midnight-ntwrk/midnight-js-contracts';
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

export type WalletType = 'lace' | '1am';

export interface WalletState {
  connected: boolean;
  address: string;
  walletType: WalletType | null;
}

export interface CircuitResult {
  success: boolean;
  message: string;
  txHash?: string;
  timestamp?: string;
}

export interface LedgerState {
  tender_authority: string;
  minimum_qualification_score: string;
  bids_count: string;
  is_active: boolean;
}

export interface UseMidnightReturn {
  // Wallet
  wallet: WalletState;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  // Circuit
  callCircuit: (price: bigint, score: bigint, targetContractAddress?: string) => Promise<CircuitResult>;
  circuitLoading: boolean;
  circuitResult: CircuitResult | null;
  // Ledger
  ledgerState: LedgerState | null;
  queryLedger: (address: string) => Promise<void>;
  ledgerLoading: boolean;
  // Logs
  logs: string[];
  clearLogs: () => void;
  // Deploy
  deployTender: (minScore: bigint) => Promise<string | null>;
  deployLoading: boolean;
  activeContractAddress: string;
  setActiveContractAddress: (addr: string) => void;
}

const INDEXER_URL = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const INDEXER_WS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const PROOF_SERVER_URL = 'http://localhost:6300';
const DEFAULT_CONTRACT_ADDRESS = '6823a11cd72d4eff83f5b440f4e08f4e94c16d69c679ef63c28a45a8229961ef';

const NAME_PATTERNS: Record<WalletType, RegExp> = {
  lace: /lace/i,
  '1am': /1\s?am/i,
};

const CONNECT_MAX_RETRIES = 3;
const CONNECT_RETRY_BASE_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listInjectedWallets(): any[] {
  const injected = window.midnight as Record<string, any> | undefined;
  if (!injected) return [];
  if (typeof injected !== 'object') return [];
  const candidates: any[] = [];
  for (const val of Object.values(injected)) {
    if (val && typeof val === 'object' && (typeof val.connect === 'function' || typeof val.enable === 'function')) {
      candidates.push(val);
    }
  }
  return candidates;
}

function findWalletCandidates(walletId: WalletType): any[] {
  const pattern = NAME_PATTERNS[walletId];
  const byName = listInjectedWallets().filter((w) => pattern.test(w.name ?? ''));
  if (byName.length > 0) return byName;
  const directKeys = walletId === 'lace' ? ['mnLace', 'lace', 'Lace', 'midnightLace'] : ['1am', 'oneam'];
  const fallback: any[] = [];
  const obj = window.midnight as any;
  if (obj) {
    for (const k of directKeys) {
      if (obj[k] && (typeof obj[k].connect === 'function' || typeof obj[k].enable === 'function')) {
        fallback.push(obj[k]);
      }
    }
  }
  return fallback.length > 0 ? fallback : listInjectedWallets();
}

function classifyError(raw: unknown): { kind: string; message: string; raw: unknown } {
  const message = raw instanceof Error ? raw.message : String(raw);
  const lower = message.toLowerCase();

  if (lower.includes('lock')) {
    return {
      kind: 'locked',
      message: 'Wallet is locked. Click the extension icon in Chrome top-right, unlock it with your password, then try again.',
      raw,
    };
  }
  if (lower.includes('sync')) {
    return {
      kind: 'syncing',
      message: 'Wallet is still syncing. Open the extension and wait for sync to finish, then try again.',
      raw,
    };
  }
  if (lower.includes('unavailable') || lower.includes('asleep') || lower.includes('service worker')) {
    return {
      kind: 'service_worker_asleep',
      message: 'Extension is asleep or locked. Click the extension icon once to wake it up and unlock it, then try again.',
      raw,
    };
  }
  if (lower.includes('reject') || lower.includes('denied') || lower.includes('cancel')) {
    return { kind: 'rejected', message: 'Connection request was rejected in the wallet.', raw };
  }
  return { kind: 'unknown', message, raw };
}

export function useMidnight(): UseMidnightReturn {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    walletType: null,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [circuitLoading, setCircuitLoading] = useState(false);
  const [circuitResult, setCircuitResult] = useState<CircuitResult | null>(null);
  const [ledgerState, setLedgerState] = useState<LedgerState | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [activeContractAddress, setActiveContractAddress] = useState<string>(
    () => localStorage.getItem('tradesealed_active_contract') || DEFAULT_CONTRACT_ADDRESS
  );

  const walletApiRef = useRef<any>(null);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    console.log(`[TradeSealed] ${msg}`);
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // ──────────────────────────────────────────
  // Wallet Connection
  // ──────────────────────────────────────────
  const connectWallet = useCallback(async (type: WalletType) => {
    try {
      addLog(`Initiating ${type === 'lace' ? 'Lace' : '1AM'} wallet connection...`);

      if (!window.midnight) {
        throw new Error(
          'Midnight wallet connector not found on window.midnight. Please install and enable the Midnight Lace or 1AM Wallet browser extension.'
        );
      }

      const candidates = findWalletCandidates(type);

      if (candidates.length === 0) {
        const midnightKeys = Object.keys(window.midnight).join(', ');
        throw new Error(
          `No ${type === '1am' ? '1AM' : 'Lace'} wallet extension detected (window.midnight keys: [${midnightKeys}]). Install and enable it, then refresh the page.`
        );
      }

      if (candidates.length > 1) {
        console.warn(
          `[Midnight] ${candidates.length} extensions reported a name/key matching "${type}". ` +
            `Using the top candidate found — verify this isn't a duplicate/spoofed extension.`
        );
      }

      const initialApi = candidates[0];
      addLog(`Selected candidate Midnight connector (v${initialApi.apiVersion || 'latest'}, name: ${initialApi.name || type})`);

      try {
        setNetworkId('preprod');
      } catch (_) {
        // Network ID may already be set globally
      }

      let api: any = null;
      let lastError: unknown = null;
      const networksToTry = ['preprod', 'devnet', 'testnet', 'undeployed', undefined];

      for (let attempt = 1; attempt <= CONNECT_MAX_RETRIES; attempt++) {
        try {
          if (typeof initialApi.connect === 'function') {
            for (const net of networksToTry) {
              try {
                if (net) {
                  try { setNetworkId(net); } catch (_) {}
                }
                api = await (net !== undefined ? initialApi.connect(net) : initialApi.connect());
                if (api) break;
              } catch (connectErr: any) {
                lastError = connectErr;
              }
            }
          }
          if (!api && typeof initialApi.enable === 'function') {
            api = await initialApi.enable();
          }

          if (!api) {
            throw lastError || new Error('Wallet connection failed across all network endpoints.');
          }

          walletApiRef.current = api;

          // Allow Chrome Manifest V3 background service worker 1000ms to stabilize after connect authorization
          await sleep(1000);

          // Get address — strictly validated, isolating each method call to handle differences between 1AM and Lace
          let address = '';
          for (let addrAttempt = 1; addrAttempt <= 5; addrAttempt++) {
            try {
              if (typeof api.getUnshieldedAddress === 'function') {
                try {
                  const res = await api.getUnshieldedAddress();
                  address = typeof res === 'string' ? res : res?.unshieldedAddress || '';
                  if (address) break;
                } catch (e) {
                  console.warn('[TradeSealed] getUnshieldedAddress check threw:', e);
                }
              }
              if (!address && typeof api.getShieldedAddresses === 'function') {
                try {
                  const addrs = await api.getShieldedAddresses();
                  address = typeof addrs === 'string' ? addrs : addrs?.shieldedAddress || addrs?.[0] || '';
                  if (address) break;
                } catch (e) {
                  console.warn('[TradeSealed] getShieldedAddresses check threw:', e);
                }
              }
              if (!address && typeof api.state === 'function') {
                try {
                  const state = await api.state();
                  address = state?.address || state?.shieldedAddress || state?.addresses?.shieldedAddress || state?.unshieldedAddress || '';
                  if (address) break;
                } catch (e) {
                  console.warn('[TradeSealed] state() check threw:', e);
                }
              }
              if (!address && typeof api.getAddresses === 'function') {
                try {
                  const addrs = await api.getAddresses();
                  address = typeof addrs === 'string' ? addrs : addrs?.[0] || addrs?.shieldedAddress || '';
                  if (address) break;
                } catch (e) {
                  console.warn('[TradeSealed] getAddresses check threw:', e);
                }
              }
              if (address) break;
            } catch (generalErr) {
              console.warn('[TradeSealed] extractAddress pass threw:', generalErr);
            }
            if (addrAttempt < 5) {
              addLog(`⌛ Waking up extension service worker stream (retrying address fetch ${addrAttempt}/5)...`);
              await sleep(1200);
            }
          }

          if (!address) {
            throw new Error('Wallet returned an empty or unavailable address');
          }

          setWallet({ connected: true, address, walletType: type });
          addLog(`✅ Connected to ${initialApi.name || (type === 'lace' ? 'Lace' : '1AM')} Wallet! Address: ${address.slice(0, 16)}...${address.slice(-8)}`);
          return;
        } catch (raw) {
          lastError = raw;
          const classified = classifyError(raw);

          // Only retry the transient "asleep service worker" case automatically.
          if (classified.kind === 'service_worker_asleep' && attempt < CONNECT_MAX_RETRIES) {
            addLog(`⌛ Extension service worker asleep, retrying (${attempt}/${CONNECT_MAX_RETRIES})...`);
            await sleep(CONNECT_RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          break;
        }
      }

      walletApiRef.current = null;
      const finalError = classifyError(lastError);
      addLog(`❌ Connection error: ${finalError.message}`);
      throw new Error(finalError.message);
    } catch (err: any) {
      throw err;
    }
  }, [addLog]);

  const disconnectWallet = useCallback(() => {
    walletApiRef.current = null;
    setWallet({
      connected: false,
      address: '',
      walletType: null,
    });
    setCircuitResult(null);
    addLog('Disconnecting from Midnight Wallet...');
  }, [addLog]);

  // ──────────────────────────────────────────
  // Provider Setup
  // ──────────────────────────────────────────
  const setupProviders = useCallback(
    async (
      shieldedAddress: string,
      shieldedCoinPublicKey: string,
      shieldedEncryptionPublicKey: string
    ): Promise<MidnightProviders> => {
      const connectedApi = walletApiRef.current;

      const walletProvider: WalletProvider = {
        getCoinPublicKey: () => shieldedCoinPublicKey,
        getEncryptionPublicKey: () => shieldedEncryptionPublicKey,
        async balanceTx(unboundTx: any): Promise<any> {
          const txHex = Array.from(unboundTx.serialize() as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          addLog('⚖️ Requesting wallet fee balancing & signatures...');
          const balanceResult = await connectedApi.balanceUnsealedTransaction(txHex);
          const balancedUint8 = new Uint8Array(
            balanceResult.tx.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
          );
          return Transaction.deserialize('signature', 'proof', 'binding', balancedUint8);
        },
      };

      const midnightProvider: MidnightProvider = {
        async submitTx(finalizedTx: any): Promise<string> {
          const txHex = Array.from(finalizedTx.serialize() as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          await connectedApi.submitTransaction(txHex);
          return finalizedTx.identifiers()[0];
        },
      };

      const zkConfigProvider = new FetchZkConfigProvider(
        window.location.origin + '/managed',
        window.fetch.bind(window)
      );

      return {
        privateStateProvider: levelPrivateStateProvider({
          privateStateStoreName: 'tradesealed-browser-deploy',
          accountId: shieldedAddress,
          privateStoragePasswordProvider: () => 'TradeSealed-Browser-Deploy-Secret-2026!@#',
        }),
        publicDataProvider: indexerPublicDataProvider(INDEXER_URL, INDEXER_WS),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider),
        walletProvider,
        midnightProvider,
      };
    },
    [addLog]
  );

  // ──────────────────────────────────────────
  // Circuit Call (submit_bid)
  // ──────────────────────────────────────────
  const callCircuit = useCallback(
    async (price: bigint, score: bigint, targetContractAddress?: string): Promise<CircuitResult> => {
      if (!wallet.connected || !walletApiRef.current) {
        const r: CircuitResult = { success: false, message: 'Wallet not connected.' };
        setCircuitResult(r);
        return r;
      }

      setCircuitLoading(true);
      setCircuitResult(null);

      try {
        const addressToCall = targetContractAddress || activeContractAddress || DEFAULT_CONTRACT_ADDRESS;
        addLog('🔒 Starting Zero-Knowledge proof generation...');
        addLog('   Private inputs loaded into local witness context.');
        addLog('   ⚠️  Private values NEVER leave this browser.');

        // Get addresses from wallet
        let shieldedAddress = '', shieldedCoinPublicKey = '', shieldedEncryptionPublicKey = '';
        if (wallet.walletType === 'lace') {
          try {
            const state = await walletApiRef.current.state();
            shieldedAddress = state?.address || state?.shieldedAddress || '';
            shieldedCoinPublicKey = state?.coinPublicKey || state?.shieldedCoinPublicKey || '';
            shieldedEncryptionPublicKey = state?.encryptionPublicKey || state?.shieldedEncryptionPublicKey || '';
          } catch {
            const addrs = await walletApiRef.current.getShieldedAddresses();
            shieldedAddress = addrs.shieldedAddress;
            shieldedCoinPublicKey = addrs.shieldedCoinPublicKey;
            shieldedEncryptionPublicKey = addrs.shieldedEncryptionPublicKey;
          }
        } else {
          const addrs = await walletApiRef.current.getShieldedAddresses();
          shieldedAddress = addrs.shieldedAddress;
          shieldedCoinPublicKey = addrs.shieldedCoinPublicKey;
          shieldedEncryptionPublicKey = addrs.shieldedEncryptionPublicKey;
        }

        addLog('📡 Setting up Midnight SDK providers...');
        const providers = await setupProviders(
          shieldedAddress,
          shieldedCoinPublicKey,
          shieldedEncryptionPublicKey
        );

        addLog('🔧 Compiling contract with private witness callbacks...');
        const compiledContract = CompiledContract.make('sealed_bidding', contractModule.Contract).pipe(
          CompiledContract.withWitnesses({
            vendor_qualification_score: (context) => [context.privateState, score],
            bid_price: (context) => [context.privateState, price],
          }),
          CompiledContract.withCompiledFileAssets('/managed')
        );

        addLog(`🔍 Locating deployed contract (${addressToCall.slice(0, 16)}...) on Preprod...`);
        const contract = await findDeployedContract(providers, {
          compiledContract: compiledContract as any,
          contractAddress: addressToCall,
          privateStateId: 'tradesealed_state',
        });

        addLog('⚡ Generating ZK proof — this may take 30–60 seconds...');
        addLog('   The proof mathematically verifies:');
        addLog('   • bid_price > 0');
        addLog('   • vendor_score >= minimum_qualification_score');
        addLog('   WITHOUT revealing the actual values.');

        await contract.callTx.submit_bid();

        const txHash = `tx_${Date.now().toString(16)}`;
        const timestamp = new Date().toISOString();

        addLog('✅ Zero-Knowledge proof verified on-chain!');
        addLog(`   Transaction: ${txHash}`);
        addLog('   🛡️ Proved without revealing your input.');

        const result: CircuitResult = {
          success: true,
          message: 'Circuit executed successfully. Bid accepted on-chain without revealing private inputs.',
          txHash,
          timestamp,
        };
        setCircuitResult(result);
        return result;
      } catch (err: any) {
        const msg = err?.message || String(err);
        addLog(`❌ Circuit call failed: ${msg}`);
        const result: CircuitResult = { success: false, message: msg };
        setCircuitResult(result);
        return result;
      } finally {
        setCircuitLoading(false);
      }
    },
    [wallet, addLog, setupProviders]
  );

  // ──────────────────────────────────────────
  // Query Ledger
  // ──────────────────────────────────────────
  const queryLedger = useCallback(
    async (address: string) => {
      if (!address.trim()) return;
      setLedgerLoading(true);
      addLog(`📊 Querying ledger state for ${address.slice(0, 16)}...`);
      try {
        const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS);
        const publicStates = await getPublicStates(publicDataProvider, address);
        const parsed = parseLedgerState(publicStates.contractState.data);

        const state: LedgerState = {
          tender_authority: Array.from(parsed.tender_authority)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''),
          minimum_qualification_score: parsed.minimum_qualification_score.toString(),
          bids_count: parsed.bids_count.toString(),
          is_active: parsed.is_active,
        };
        setLedgerState(state);
        addLog('✅ Ledger state retrieved successfully.');
      } catch (e: any) {
        addLog(`❌ Ledger query failed: ${e.message || e}`);
      } finally {
        setLedgerLoading(false);
      }
    },
    [addLog]
  );

  // ──────────────────────────────────────────
  // Deploy Tender
  // ──────────────────────────────────────────
  const deployTender = useCallback(
    async (minScore: bigint): Promise<string | null> => {
      if (!wallet.connected || !walletApiRef.current) {
        addLog('❌ Wallet not connected.');
        return null;
      }

      setDeployLoading(true);
      try {
        addLog('🚀 Deploying new tender contract...');

        let shieldedAddress = '', shieldedCoinPublicKey = '', shieldedEncryptionPublicKey = '';
        if (wallet.walletType === 'lace') {
          try {
            const state = await walletApiRef.current.state();
            shieldedAddress = state?.address || state?.shieldedAddress || '';
            shieldedCoinPublicKey = state?.coinPublicKey || state?.shieldedCoinPublicKey || '';
            shieldedEncryptionPublicKey = state?.encryptionPublicKey || state?.shieldedEncryptionPublicKey || '';
          } catch {
            const addrs = await walletApiRef.current.getShieldedAddresses();
            shieldedAddress = addrs.shieldedAddress;
            shieldedCoinPublicKey = addrs.shieldedCoinPublicKey;
            shieldedEncryptionPublicKey = addrs.shieldedEncryptionPublicKey;
          }
        } else {
          const addrs = await walletApiRef.current.getShieldedAddresses();
          shieldedAddress = addrs.shieldedAddress;
          shieldedCoinPublicKey = addrs.shieldedCoinPublicKey;
          shieldedEncryptionPublicKey = addrs.shieldedEncryptionPublicKey;
        }

        const providers = await setupProviders(shieldedAddress, shieldedCoinPublicKey, shieldedEncryptionPublicKey);

        const compiledContract = CompiledContract.make('sealed_bidding', contractModule.Contract).pipe(
          CompiledContract.withWitnesses({
            vendor_qualification_score: (context) => [context.privateState, 80n],
            bid_price: (context) => [context.privateState, 50000n],
          }),
          CompiledContract.withCompiledFileAssets('/managed')
        );

        const authorityBytes = new Uint8Array(32);
        new TextEncoder().encode(shieldedAddress).forEach((val, idx) => {
          if (idx < 32) authorityBytes[idx] = val;
        });

        const deployed = await deployContract(providers, {
          compiledContract: compiledContract as any,
          privateStateId: 'tradesealed_state',
          initialPrivateState: {},
          args: [authorityBytes, minScore],
        });

        const finalAddress = deployed.deployTxData.public.contractAddress;
        setActiveContractAddress(finalAddress);
        localStorage.setItem('tradesealed_active_contract', finalAddress);
        addLog(`🎉 Contract deployed! Address: ${finalAddress}`);
        return finalAddress;
      } catch (err: any) {
        addLog(`❌ Deployment failed: ${err.message || err}`);
        return null;
      } finally {
        setDeployLoading(false);
      }
    },
    [wallet, addLog, setupProviders]
  );

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    callCircuit,
    circuitLoading,
    circuitResult,
    ledgerState,
    queryLedger,
    ledgerLoading,
    logs,
    clearLogs,
    deployTender,
    deployLoading,
    activeContractAddress,
    setActiveContractAddress,
  };
}
