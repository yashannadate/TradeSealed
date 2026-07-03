/**
 * scripts/network.ts
 *
 * Midnight network configuration constants for Preprod and Preview.
 * Official endpoint documentation: https://docs.midnight.network/develop/reference/environments
 */

export type NetworkId = 'preprod' | 'preview' | 'undeployed';

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;       // GraphQL HTTP endpoint (public data provider)
  indexerWS: string;     // GraphQL WebSocket endpoint (real-time state updates)
  node: string;          // Midnight node RPC (for tNIGHT registration)
  proofServer: string;   // Local proof server (ZK proof generation)
  faucet: string;        // Faucet URL for test tokens
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  preprod: {
    networkId: 'preprod',
    indexer:   'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node:      'https://rpc.preprod.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    faucet:    'https://faucet.preprod.midnight.network',
  },
  preview: {
    networkId: 'preview',
    indexer:   'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node:      'https://rpc.preview.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    faucet:    'https://faucet.preview.midnight.network',
  },
  undeployed: {
    networkId: 'undeployed',
    indexer:   'http://127.0.0.1:8088/api/v1/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v1/graphql/ws',
    node:      'http://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    faucet:    '',
  },
};

/**
 * Parses --network <id> from process.argv.
 * Defaults to 'undeployed' (local devnet) if not specified.
 */
export function parseNetwork(): { networkId: NetworkId; config: NetworkConfig } {
  const args = process.argv;
  const idx = args.indexOf('--network');
  if (idx !== -1 && args[idx + 1]) {
    const id = args[idx + 1] as NetworkId;
    if (!NETWORKS[id]) throw new Error(`Unknown network: ${id}. Use: preprod | preview | undeployed`);
    return { networkId: id, config: NETWORKS[id] };
  }
  return { networkId: 'undeployed', config: NETWORKS['undeployed'] };
}
