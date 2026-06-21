# Elektron Net

A minimal, focused fork of Bitcoin Core. Elektron Net preserves Bitcoin's SHA-256d proof-of-work consensus, the 21,000,000 supply cap, the four-year halving rhythm, and the entire P2P, script, and wallet stack. Two deliberate protocol changes set it apart: **60-second blocks** and **mandatory 137-day pruning**. This page covers what's specific to running it on StartOS.

## The idea in one paragraph

Bitcoin's ledger is a monument: every transaction etched in cryptographic stone, forever. Elektron Net takes a different stance — borrowed from Stoic philosophy: secure what you can control, let go of what you cannot. The UTXO set — your current balance, your "pocket" — is the only permanent data structure in the network. Transaction history before the trailing 137-day window (α⁻¹ days, the fine-structure constant) is **mathematically erased**. Not hidden, not encrypted — gone. Not because anyone ordered it, but because the protocol makes retention impossible. Named after the Lydian Elektron, struck in Asia Minor around 600 BC — the first decentralised currency in history.

The currency unit is **Elektron** (symbol: **ELEK**, 1 ELEK = 10⁸ leptons). For the full motivation, see the [Elektron Net Whitepaper](https://github.com/kutlusoy/elektron-net/blob/main/WHITEPAPER.md). For the implementation diff against Bitcoin Core, see [`doc-elektron/BITCOIN_CORE_DIFF.md`](https://github.com/kutlusoy/elektron-net/blob/main/doc-elektron/BITCOIN_CORE_DIFF.md).

## What stays the same as Bitcoin

- SHA-256d proof-of-work consensus, Nakamoto longest-chain rule
- 21,000,000 supply cap, halving every four calendar years
- BIP-32/39/44 wallets, descriptor wallets, Bech32m, Schnorr/Taproot
- JSON-RPC on port **8332**, P2P on port **8333**, ZMQ on **28332/28333**
- bitcoin.conf as the configuration file
- LevelDB / RocksDB storage backends

## What changes

| Parameter | Bitcoin | Elektron Net |
|-----------|---------|--------------|
| Block time | 10 min | **60 sec** |
| Blocks per day | 144 | **1,440** |
| Retarget interval | 2,016 blocks (≈2 weeks) | 2,016 blocks (≈1.4 days) |
| Difficulty recovery | none | **Stoic Awakening** (min-difficulty after >120 s delay, from block 1) |
| Pruning | optional, user-defined GB target | **mandatory**, 197,280 blocks (≈137 days) |
| UTXO attestation | none | **every block** (37 bytes coinbase OP_RETURN) |
| Snapshots | manual AssumeUTXO (hardcoded hashes) | **automatic** at every 137-day checkpoint, on-chain attested |
| User agent | `Bitcoin` | `Elektron` |
| Currency unit | BTC (1 = 10⁸ satoshi) | **ELEK** (1 = 10⁸ leptons) |
| Genesis reward | 50 BTC | **5 ELEK** |

## What you get on StartOS

- **A full Elektron Net node** — downloads, verifies, and relays the chain, then stays in sync within the 137-day window.
- **JSON-RPC interface on port 8332** — services that speak `bitcoind`-style RPC generally work unchanged for data within the retention window.
- **ZeroMQ block and transaction notifications** for Lightning nodes, indexers, and mempool subscribers.
- **Privacy networking out of the box** — outbound peer connections over Tor; a bundled I2P daemon accepts inbound I2P connections.
- **Configuration through StartOS actions** instead of hand-editing `bitcoin.conf`.

## Getting set up

There is no setup wizard. Elektron Net begins syncing on first launch.

1. Open the **Dashboard** to watch sync progress. On a fresh network or after a snapshot bootstrap, the initial sync is short — minutes to hours, not days.
2. To use a service that depends on Elektron Net — a Lightning node, a block explorer, a wallet backend — install it; it will configure its connection automatically.
3. To connect an external wallet or app, run **Generate RPC User Credentials**, then point the app at port 8332.

## Mandatory pruning (no archival mode)

This is the single most important thing to understand before integrating.

- The network mathematically **discards block files older than 197,280 blocks** from the tip. No node — yours or anyone else's — can retain them.
- The **UTXO set is the only permanent structure**. It contains exactly what you possess in this moment. Nothing more, nothing less.
- A wallet whose last-synced height is older than the pruning window is restored via **UTXO scan**: seed phrase + scan of the live UTXO set recovers spendable balance. Past transaction *details* (timestamps, counterparties, fees) are not recoverable from the network — by design. The Pocket philosophy: only the present matters.
- `-prune=<GB>` in `bitcoin.conf` is ignored — retention is depth-based and fixed.
- `-txindex` is incompatible with mandatory pruning and is always off.
- Block explorers and indexers that need full history must maintain their own index.

This is the "right to be forgotten" implemented as a consensus rule rather than a legal promise. No court order can compel retention, because the protocol makes retention impossible.

## Stoic Awakening — chain liveness

A payment network that stalls is not a payment network. If a dominant miner suddenly leaves, the remaining hashrate may not find the next block before the regular retarget. Elektron Net solves this with **Stoic Awakening**: if more than 120 seconds (2× target spacing) have elapsed since the last block, the next block may be mined at minimum difficulty (`powLimit`). The block after returns to the regular 2,016-block average. This is height-activated from block 1 — not a testnet leftover. ASIC firmware is unaffected; pool backends just need to honour the `bits` field from GBT.

## Mining (pool / Stratum integrators)

Standard Bitcoin Stratum servers produce **invalid** blocks until adapted. The required changes:

- Read **`coinbase_required_outputs`** from every `getblocktemplate` response and append every listed output (witness commitment + UTXO attestation) to the coinbase, in order.
- Do **not** compute the UTXO attestation hash yourself — copy the `scriptPubKey` from GBT.
- Fetch a fresh GBT per block (the attestation changes every block).
- Respect the `bits` field from GBT to honour Stoic Awakening transitions.

Reference miner code: [`mining/miner.py`](https://github.com/kutlusoy/elektron-net/blob/main/mining/miner.py), [`mining/miner.cpp`](https://github.com/kutlusoy/elektron-net/blob/main/mining/miner.cpp). Detailed pool integration guide: [`doc-elektron/mining-pool-integration.md`](https://github.com/kutlusoy/elektron-net/blob/main/doc-elektron/mining-pool-integration.md). ASIC firmware needs no changes — it only hashes block headers.

## Using Elektron Net

The **Dashboard** shows RPC, peer, ZMQ, and (when enabled) the I2P console. Everything else is driven by actions in the sidebar.

### RPC access

The JSON-RPC API listens on port 8332. Dependent StartOS services connect and configure themselves automatically. For an external wallet, run **Generate RPC User Credentials**, then point the app at port 8332. `rpcuser`/`rpcpassword` lines in `bitcoin.conf` are not supported; authentication is the `.cookie` file or `rpcauth` users.

### Configuration

Four actions write to `bitcoin.conf` for you. Only values that differ from upstream defaults are stored.

- **Mempool Settings** — mempool size and expiry, persistence, bare-multisig and `OP_RETURN` relay policy, blocks-only mode.
- **Peer Settings** — `onlynet` (IPv4/IPv6/Tor/I2P), BIP324 v2 transport, the embedded I2P SAM proxy, manual `addnode`/`connect` peers.
- **RPC Settings** — RPC server timeout, thread count, work-queue depth.
- **Other Settings** — ZeroMQ, BIP158/BIP157 block filters, bloom filters, wallet options, database cache tuning. **Pruning, `txindex`, and coinstats index are not exposed** — they are protocol-level constraints, not user choices.

RPC cookie authentication, peer listen ports, and the Tor proxy are fixed by the package. Advanced i2pd tuning isn't in the UI — edit `i2pd.conf` on the `i2pd` volume.

### Air-gapped workflows

The runtime image ships with `elektron-tx`, `elektron-util`, and `elektron-wallet` alongside `elektrond` and `elektron-cli`. With these you can:

- Build and sign transactions on an offline machine (`elektron-tx`)
- Inspect block headers, decode PSBTs, run helper computations (`elektron-util`)
- Manage standalone wallet files without a running daemon (`elektron-wallet`)

External signer support (Hardware Wallets — Trezor, Ledger via HWI) is compiled in.

### Maintenance

- **Reindex Blockchain** — rebuild blocks and chainstate from scratch (after on-disk corruption). Since Elektron Net is always pruned, this re-syncs from the network within the 137-day window.
- **Reindex Chainstate** — rebuild just the chainstate from existing blocks.
- **Delete Peer List** — remove a corrupted `peers.dat`. Service must be stopped to run this.

### Other actions

- **Runtime Information** — connection count, block height, sync progress, soft-fork status.

## Limitations to plan around

- **No archival mode.** Block and transaction data older than ~137 days is not retained anywhere in the network. Integrations that require full history must maintain their own index.
- **Mining software must be updated** to read `coinbase_required_outputs`. Unadapted Bitcoin Stratum servers produce invalid blocks.
- **Blockchain data is not backed up.** Backups cover `bitcoin.conf`, `store.json`, wallets, `peers.dat`, and snapshot files in `snapshots/` — block and chainstate re-sync after restore.
- **Wallet history is not re-fetchable.** A restored wallet recovers spendable balance via UTXO scan; past transaction details older than 137 days are gone — this is by design, not a bug.
- **Shutdown can take up to 5 minutes** while the database flushes; let it finish rather than force-stopping.
