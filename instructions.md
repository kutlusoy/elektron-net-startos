# Elektron Net

Elektron Net begins its Initial Block Download (IBD) — fetching and verifying the chain — the moment it launches; nothing needs configuring first. This page covers what's specific to running it on StartOS, and the points where Elektron Net deliberately diverges from Bitcoin Core.

## About Elektron Net

Elektron Net is a Bitcoin Core fork with:

- **60-second block times** (10× faster than Bitcoin).
- **Mandatory 137-day transaction history retention** — every node prunes block files older than 197,280 blocks from the tip, regardless of disk size. There is no archival-mode option.
- **Per-block UTXO attestation** — every coinbase contains a cryptographic commitment to the UTXO set after the block, embedded in `OP_RETURN`. Miners must include it; pools and Stratum software need to read `coinbase_required_outputs` from GBT.
- **Automatic snapshot checkpoints** every 197,280 blocks, with on-chain attestation verification — new nodes can bootstrap from a verified snapshot instead of replaying the full chain.
- **Wallet "Pocket" recovery** — a wallet whose last-synced height predates the pruning window is restored by scanning the live UTXO set; balances come back, but transaction history older than ~137 days is not preserved by the network.
- **`MAX_MONEY` unchanged at 21,000,000 ELEK**, halving every 2,102,400 blocks (~same 4-year calendar cadence as Bitcoin).
- **Smallest unit: lepton** (1 ELEK = 10⁸ leptons), currency symbol `ELEK`.

For the full technical diff against Bitcoin Core, see [`doc/BITCOIN_CORE_DIFF.md`](https://github.com/kutlusoy/elektron-net/blob/main/doc/BITCOIN_CORE_DIFF.md) in the upstream repository.

## What you get on StartOS

- **A full Elektron Net node** — downloads, verifies, and relays the chain, then stays in sync.
- **A JSON-RPC interface on port 8332** that other StartOS services and external apps connect to. The RPC surface is largely Bitcoin-compatible; services that speak `bitcoind` RPC generally work unchanged for current-window data.
- **ZeroMQ block and transaction notifications** for services that subscribe to them.
- **Privacy networking out of the box** — outbound peer connections go over Tor, and a bundled I2P daemon accepts inbound I2P connections.
- **Mandatory pruning** — Elektron Net always runs pruned (137-day window). You cannot toggle this off; it is a protocol-level requirement, not a packaging choice.
- **Configuration through StartOS actions** instead of hand-editing `bitcoin.conf`.

## Getting set up

There is no setup wizard. Elektron Net begins syncing on first launch.

1. Open Elektron Net's **Dashboard** tab to watch sync progress. On a fresh network or after a snapshot bootstrap, the initial sync is fast — typically minutes to hours rather than days.
2. To use a service that depends on Elektron Net — a Lightning node, a block explorer, a wallet backend — install it; it will configure its connection automatically.
3. To connect an external wallet or app, run **Generate RPC User Credentials** to mint a username and password, then point the app at port 8332.

## Using Elektron Net

Elektron Net surfaces its interfaces — RPC, peer, ZeroMQ, and the I2P console when enabled — on the **Dashboard** tab; everything else is driven by actions in the service's sidebar.

### RPC access

The JSON-RPC API listens on port 8332. Dependent StartOS services connect and configure themselves automatically when installed. For an external wallet or app, run **Generate RPC User Credentials**, then point the app at port 8332. `rpcuser`/`rpcpassword` lines in `bitcoin.conf` are not supported and are stripped; authentication is the `.cookie` file or `rpcauth` users.

### Mandatory pruning (no archival mode)

Elektron Net always retains 197,280 blocks (~137 days) of chain history; older blocks are deleted, network-wide, by design ("right to be forgotten"). Implications:

- Wallets that need transaction history older than the pruning window will not find it on the network. Use seed + UTXO scan to recover spendable balance instead.
- Block explorers and indexers must maintain their own historical index if they need anything beyond the current window.
- `-prune=<GB>` in `bitcoin.conf` is ignored — retention is depth-based and fixed.
- `-txindex` is incompatible with mandatory pruning and is always off.

### Mining

Pools and Stratum backends **must** read `coinbase_required_outputs` from `getblocktemplate` and append the listed outputs (witness commitment + UTXO attestation) to every coinbase. Blocks without the attestation are rejected. Reference miner code is in the upstream `mining/` directory. ASIC firmware is unaffected (it only hashes block headers).

### Configuration

Four actions write to `bitcoin.conf` for you. Only values that differ from upstream defaults are stored.

- **Mempool Settings** — mempool size and expiry, persistence, bare-multisig and `OP_RETURN` relay policy, blocks-only mode.
- **Peer Settings** — which networks to use (`onlynet`: IPv4/IPv6/Tor/I2P), BIP324 v2 transport, the embedded I2P SAM proxy, manual `addnode`/`connect` peers.
- **RPC Settings** — RPC server timeout, thread count, work-queue depth.
- **Other Settings** — ZeroMQ, BIP158/BIP157 block filters, bloom filters, wallet options, database cache tuning. Pruning, `txindex`, and coinstats index are not exposed — see the Elektron Net-specific notes above.

Some options are fixed by the package and not exposed: RPC cookie authentication, peer listen ports, the Tor proxy. Advanced i2pd tuning isn't in the UI either — edit `i2pd.conf` on the `i2pd` volume if you need it.

### Maintenance

- **Reindex Blockchain** — rebuild blocks and chainstate from scratch (use after on-disk corruption). Since Elektron Net is always pruned, this re-syncs from the network.
- **Reindex Chainstate** — rebuild just the chainstate from existing blocks.
- **Delete Peer List** — remove a corrupted `peers.dat`. The service must be stopped to run this.

### Other actions

- **Runtime Information** — connection count, block height, sync progress, soft-fork status.

## Limitations

- **No archival mode.** Block and transaction data older than ~137 days is not retained anywhere in the network — by design. Plan integrations accordingly.
- **Mining software must be updated** to read `coinbase_required_outputs`. Standard Bitcoin Stratum servers will produce invalid blocks until adapted.
- **Blockchain data is not backed up.** Backups cover `bitcoin.conf`, `store.json`, wallets, `peers.dat`, and snapshot files (`snapshots/`) — block and chainstate re-sync after a restore.
- **Shutdown can take up to 5 minutes** while the database flushes; let it finish rather than force-stopping.
