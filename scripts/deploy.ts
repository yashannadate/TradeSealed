/**
 * scripts/deploy.ts
 *
 * Deploys the TradeSealed sealed_bidding contract to Midnight Preprod.
 *
 * Contract: contract/src/sealed_bidding.compact
 * Compiled:  contract/managed/ (keys/, zkir/, contract/index.js)
 *
 * Constructor args:
 *   authority_0: Uint8Array  — Bytes<32> deployer public key → tender_authority ledger field
 *   min_score_0: bigint      — Uint<64>  minimum vendor qualification score (default: 75)
 *
 * Usage:
 *   npx tsx scripts/deploy.ts --network preprod
 */

import * as fs   from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

// Official Midnight JS SDK
import { deployContract }            from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider }   from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider }      from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract }          from '@midnight-ntwrk/compact-js';

// Local helpers
import { parseNetwork }              from './network.js';
import { getOrCreateSeed, createWallet, type WalletContext } from './wallet.js';

// Node.js WebSocket polyfill required by Midnight SDK
// @ts-expect-error — globalThis polyfill
globalThis.WebSocket = WebSocket;

// ─── Network ──────────────────────────────────────────────────────────────────

const { networkId, config: networkConfig } = parseNetwork();

// ─── Contract artifacts ────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const managedPath = path.resolve(__dirname, '..', 'contract', 'managed');
const contractIndexPath = path.join(managedPath, 'contract', 'index.js');

console.log('\n📂 Compiled contract path:', managedPath);

if (!fs.existsSync(contractIndexPath)) {
  console.error('\n❌ Compiled contract not found!');
  console.error('   Run first: npm run compile');
  console.error(`   Expected:  ${contractIndexPath}\n`);
  process.exit(1);
}

const SealedBiddingModule = await import(pathToFileURL(contractIndexPath).href);

const compiledContract = CompiledContract.make('sealed_bidding', SealedBiddingModule.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(managedPath),
);

// ─── Proof server check ────────────────────────────────────────────────────────

async function waitForProofServer(maxAttempts = 30, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(networkConfig.proofServer, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok || res.status < 500) return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT' && code !== 'UND_ERR_SOCKET') {
        return true;
      }
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  ⏳ Waiting for proof server... (attempt ${attempt}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

// ─── Provider setup ────────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim()
    ?? 'TradeSealed-Preprod-Deploy-2026-PrivateState';

  const state = await walletCtx.wallet.waitForSyncedState();

  // walletProvider implements WalletProvider & MidnightProvider interfaces
  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, (payload: Uint8Array) =>
        walletCtx.unshieldedKeystore.signData(payload),
      );
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(managedPath);
  const accountId = walletCtx.getAddress().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'tradesealed-sealed-bidding',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         TradeSealed — Contract Deployment                    ║');
  console.log('║         Contract: sealed_bidding.compact                     ║');
  console.log(`║         Network:  ${networkId.padEnd(42)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('─── Step 1: Wallet Setup ───────────────────────────────────────\n');
  const seed = getOrCreateSeed();
  console.log('  Creating wallet from seed...');

  const walletCtx = await createWallet(networkId, networkConfig, seed);
  const address = walletCtx.getAddress();

  console.log('─── Step 2: Network Sync ───────────────────────────────────────\n');
  console.log('  Syncing wallet with Midnight Preprod...');
  console.log('  ℹ  First sync downloads chain history — may take 5–20 minutes.\n');

  const syncStart = Date.now();
  const syncTick = setInterval(() => {
    const s = Math.round((Date.now() - syncStart) / 1000);
    process.stdout.write(`\r  ⏳ Syncing... (${s}s elapsed)   `);
  }, 5000);

  let state: any;
  for (let syncAttempt = 1; syncAttempt <= 30; syncAttempt++) {
    try {
      state = await walletCtx.wallet.waitForSyncedState();
      break;
    } catch (err: any) {
      const errTag = err?._tag || err?.message || JSON.stringify(err);
      if (syncAttempt < 30) {
        process.stdout.write(`\n  ⚠️  Indexer socket dropped (${errTag}). Resuming sync from local LevelDB checkpoint (attempt ${syncAttempt}/30)...\n`);
        try { await walletCtx.wallet.stop(); } catch {}
        await new Promise((r) => setTimeout(r, 4000));
        walletCtx = await createWallet(networkId, networkConfig, seed);
      } else {
        clearInterval(syncTick);
        throw err;
      }
    }
  }
  clearInterval(syncTick);
  process.stdout.write('\r  ✅ Synced with Preprod network!                          \n\n');

  const { nativeToken } = await import('@midnight-ntwrk/ledger-v8');
  const balance = (state as any).unshielded?.balances?.[nativeToken().raw] ?? 0n;

  console.log(`  Wallet Address : ${address}`);
  console.log(`  tNIGHT Balance : ${balance.toLocaleString()}\n`);

  if (balance === 0n && networkId !== 'undeployed') {
    console.log('─── Step 3: Fund Wallet ────────────────────────────────────────\n');
    console.log('  ⚠️  Wallet has 0 tNIGHT. Please fund it now:\n');
    console.log(`  Address : ${address}`);
    console.log(`  Faucet  : ${networkConfig.faucet}\n`);
    console.log('  Waiting for tNIGHT (polling every 10s, max 10 min)...\n');

    const timeout = Number(process.env.MIDNIGHT_FAUCET_TIMEOUT_MS) || 600_000;
    const start = Date.now();
    while (true) {
      await new Promise((r) => setTimeout(r, 10_000));
      const s = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((x: any) => x.isSynced)));
      const bal = (s as any).unshielded?.balances?.[nativeToken().raw] ?? 0n;
      if (bal > 0n) {
        console.log(`  ✅ Funded! tNIGHT: ${bal.toLocaleString()}\n`);
        break;
      }
      if (Date.now() - start > timeout) {
        console.log('\n  ❌ Funding timeout (10 min). Re-run after funding the wallet.\n');
        await walletCtx.wallet.stop();
        process.exit(1);
      }
      process.stdout.write(`\r  Still waiting... (${Math.round((Date.now() - start) / 1000)}s)`);
    }
  } else {
    console.log('─── Step 3: Wallet Funded ──────────────────────────────────────\n');
    console.log('  ✅ tNIGHT balance confirmed.\n');
  }

  console.log('─── Step 4: DUST Token Setup ───────────────────────────────────\n');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregistered = (dustState as any).unshielded?.availableCoins?.filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  ) ?? [];

  if (unregistered.length > 0) {
    console.log(`  Registering ${unregistered.length} tNIGHT UTXOs for DUST generation...`);
    try {
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        walletCtx.getPublicKeyBytes(),
        (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
      );
      const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
      await walletCtx.wallet.submitTransaction(finalized);
      console.log('  ✅ Registered for DUST generation.\n');
    } catch (e: any) {
      console.log(`  ⚠️  DUST registration: ${e.message}\n`);
    }
  } else {
    console.log('  ✅ UTXOs already registered for DUST generation.\n');
  }

  const dustBalance = (dustState as any).dust?.balance?.(new Date()) ?? 0n;
  if (dustBalance === 0n) {
    console.log('  ⏳ Waiting for first tDUST to accumulate...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s: any) => s.isSynced),
        Rx.filter((s: any) => (s.dust?.balance?.(new Date()) ?? 0n) > 0n),
      ),
    );
    console.log('  ✅ tDUST ready!\n');
  } else {
    console.log(`  ✅ tDUST available: ${dustBalance.toLocaleString()}\n`);
  }

  console.log('─── Step 5: Proof Server ───────────────────────────────────────\n');
  console.log(`  Checking proof server at ${networkConfig.proofServer}...`);
  const proofReady = await waitForProofServer();
  if (!proofReady) {
    console.log('\n  ❌ Proof server not responding!');
    console.log('  Start it with: wsl docker start proof-server\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }
  process.stdout.write('\r  ✅ Proof server is ready!                              \n\n');

  console.log('─── Step 6: Deploy sealed_bidding Contract ─────────────────────\n');
  console.log('  Setting up SDK providers...');
  const providers = await createProviders(walletCtx);

  process.stdout.write('  Allowing DUST to settle (6s)...');
  await new Promise((r) => setTimeout(r, 6000));
  process.stdout.write(' done.\n\n');

  const authorityBytes = walletCtx.getPublicKeyBytes();
  const minScore = BigInt(process.env.MIN_SCORE ?? '75');
  console.log(`  Constructor args:`);
  console.log(`    tender_authority            = 0x${Buffer.from(authorityBytes).toString('hex').slice(0, 16)}...`);
  console.log(`    minimum_qualification_score = ${minScore}n\n`);
  console.log('  Calling deployContract()...\n');

  const MAX_RETRIES = 20;
  const RETRY_DELAY = 5_000;
  let deployed: Awaited<ReturnType<typeof deployContract>> | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        args: [authorityBytes, minScore],
      });
      break;
    } catch (err: any) {
      const msg = err?.message ?? '';
      const cause = err?.cause?.message ?? '';
      const full = `${msg} ${cause}`;

      const isDust = full.includes('Not enough Dust') || full.includes('Insufficient Funds') || full.includes('could not balance dust');
      const isNoProof = full.includes('ECONNREFUSED') || full.includes('Failed to connect to Proof Server');

      if (!(isDust && attempt === 1)) {
        console.error(`  ⚠️  Attempt ${attempt}/${MAX_RETRIES}: ${msg}`);
      }

      if (isNoProof) {
        console.log('  ❌ Proof server lost. Run: wsl docker start proof-server\n');
        await walletCtx.wallet.stop();
        process.exit(1);
      }

      if (isDust && attempt < MAX_RETRIES) {
        const cur = (await walletCtx.wallet.waitForSyncedState() as any).dust?.balance?.(new Date()) ?? 0n;
        console.log(`  🔄 DUST: ${cur.toLocaleString()} — retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      } else if (!isDust) {
        throw err;
      } else {
        console.log('  ❌ DUST still insufficient after all retries.');
        await walletCtx.wallet.stop();
        process.exit(1);
      }
    }
  }

  if (!deployed) throw new Error('Deployment failed after all retries.');

  const contractAddress = deployed.deployTxData.public.contractAddress;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🎉  TradeSealed deployed on Midnight Preprod!               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Contract Name    : sealed_bidding`);
  console.log(`  Circuit          : submit_bid (k=9, rows=222)`);
  console.log(`  Network          : ${networkId}`);
  console.log(`  Contract Address : ${contractAddress}`);
  console.log(`  Tender Authority : 0x${Buffer.from(authorityBytes).toString('hex').slice(0, 16)}...`);
  console.log(`  Min Score        : ${minScore}\n`);
  console.log('  ─── Explorer Links ───────────────────────────────────────────');
  console.log(`  🔗 Midnight Explorer : https://preprod.midnightexplorer.com/`);
  console.log(`  🔗 Subscan           : https://midnight-preprod.subscan.io/\n`);

  const stateFile = path.resolve(process.cwd(), '.tradesealed-wallet-state', 'deployment.json');
  fs.writeFileSync(stateFile, JSON.stringify({
    network: networkId,
    contractAddress,
    deployedAt: new Date().toISOString(),
    circuit: 'submit_bid',
    minScore: minScore.toString(),
  }, null, 2));
  console.log(`  ✅ Address saved to .tradesealed-wallet-state/deployment.json\n`);

  await walletCtx.wallet.stop();
  console.log('─── Deployment complete ─────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message ?? err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
