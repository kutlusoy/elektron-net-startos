import { FileHelper, T, utils, z } from '@start9labs/start-sdk'
import * as diskusage from 'diskusage'
import { totalmem } from 'os'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  buildZmqBundle,
  i2PSamAddress,
  parseZmqPort,
  peerPortExternal,
  peerPortInternal,
  rpcPort,
  rpcPortPruned,
  rpcallowip,
  rpcallowipPruned,
  rpcBindFor,
  rpccookiefile,
  resolvePorts,
  zmqPortBlock,
  zmqPortTransaction,
} from '../utils'

// INI coercion helpers: INI parsing returns strings, with duplicate keys producing arrays.
// Each uses .catch(undefined) to match the old optional(t) = t.optional().onMismatch(undefined)

const iniString = z
  .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
  .optional()
  .catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

const iniNumber = z
  .union([
    z.array(z.string()).transform((a) => Number(a.at(-1))),
    z.string().transform(Number),
    z.number(),
  ])
  .optional()
  .catch(undefined)

const iniBoolean = z
  .union([
    z.string().transform((s) => !!Number(s)),
    z.number().transform((n) => !!n),
    z.boolean(),
  ])
  .optional()
  .catch(undefined)

export const minPrune = 550

const validNets = ['ipv4', 'ipv6', 'onion', 'i2p'] as const
const onlyNetOption = z.enum(validNets)
type ValidNets = z.infer<typeof onlyNetOption>

export const shape = z.object({
  // RPC enforced — bind value derived from `networking.rpcport` at write time
  rpcbind: z.string().catch(`0.0.0.0:${rpcPort}`),
  rpcallowip: z.enum([rpcallowip, rpcallowipPruned]).catch(rpcallowip),
  rpcuser: z.undefined().optional().catch(undefined),
  rpcpassword: z.undefined().optional().catch(undefined),
  rpccookiefile: z.literal(rpccookiefile).catch(rpccookiefile),
  rpcport: iniNumber,
  // Peers enforced — values derived from `networking.peerport` at write time
  listen: z.literal(true).catch(true),
  bind: z.string().catch(`0.0.0.0:${peerPortInternal}`),
  whitebind: z.string().catch(`0.0.0.0:${peerPortExternal}`),
  port: iniNumber,
  // Mempool enforced
  mempoolfullrbf: z.undefined().optional().catch(undefined),

  // RPC
  rpcauth: iniStringArray,
  rpcservertimeout: iniNumber,
  rpcthreads: iniNumber,
  rpcworkqueue: iniNumber,

  // Mempool
  persistmempool: iniBoolean,
  maxmempool: iniNumber,
  mempoolexpiry: iniNumber,
  datacarrier: iniBoolean,
  datacarriersize: iniNumber,
  permitbaremultisig: iniBoolean,

  // Peers
  onlynet: z
    .union([onlyNetOption, z.array(onlyNetOption)])
    .optional()
    .catch(undefined),
  externalip: iniStringArray,
  whitelist: iniStringArray,
  v2transport: iniBoolean,
  privatebroadcast: iniBoolean,
  connect: iniStringArray,
  addnode: iniStringArray,
  maxconnections: iniNumber,
  blocksonly: iniBoolean,
  i2psam: z.literal(i2PSamAddress).optional().catch(undefined),
  i2pacceptincoming: iniBoolean,

  // Wallet
  disablewallet: iniBoolean,
  avoidpartialspends: iniBoolean,
  discardfee: iniNumber,

  // ZMQ
  zmqpubrawblock: iniString,
  zmqpubhashblock: iniString,
  zmqpubrawtx: iniString,
  zmqpubhashtx: iniString,
  zmqpubsequence: iniString,

  // Performance Tuning
  dbcache: iniNumber,
  dbbatchsize: iniNumber,
  assumevalid: iniString,

  // Other
  blocknotify: iniString,
  prune: z
    .union([
      z.array(z.string()).transform((a) => Number(a.at(-1))),
      z.string().transform(Number),
      z.number(),
    ])
    .transform((v) => (v > 0 && v < minPrune ? minPrune : v))
    .catch(minPrune),
  coinstatsindex: iniBoolean,
  txindex: iniBoolean,
  peerbloomfilters: iniBoolean,
  blockfilterindex: z
    .union([
      z.literal('basic'),
      z.union([
        z.string().transform((s) => !!Number(s)),
        z.number().transform((n) => !!n),
        z.boolean(),
      ]),
    ])
    .optional()
    .catch(undefined),
  peerblockfilters: iniBoolean,

  // Logging
  debug: iniString,
  shrinkdebugfile: iniBoolean,
  logips: iniBoolean,
  logsourcelocations: iniBoolean,
})

function stringifyPrimitives(a: unknown): any {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) {
      return a.map(stringifyPrimitives)
    }
    return Object.fromEntries(
      Object.entries(a).map(([k, v]) => [k, stringifyPrimitives(v)]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

const { InputSpec, Value, Variants, List } = sdk

export const diskUsage = utils.once(() => diskusage.check('/'))
export const archivalMin = 900_000_000_000

export const defaultDbcache = () =>
  Math.min(Math.floor((totalmem() * 0.25) / (1024 * 1024)), 5_120)

export const defaultDbbatchsize = () =>
  Math.min(Math.max(Math.floor(totalmem() / 256), 16_777_216), 33_554_432)

export const fullConfigSpec = sdk.InputSpec.of({
  raw: Value.hidden(shape),
  networking: Value.object(
    {
      name: i18n('Network Ports'),
      description: i18n(
        'Ports on which Elektron Net listens. Defaults differ from Bitcoin Core (8332/8333/28332/28333) to avoid collisions when both packages are installed on the same StartOS. A service restart is required when changing these values.',
      ),
    },
    InputSpec.of({
      rpcport: Value.number({
        name: i18n('RPC Port'),
        description: i18n(
          'JSON-RPC port. Used by wallets, indexers, and dependent packages.',
        ),
        required: false,
        default: rpcPort,
        min: 1024,
        max: 65535,
        integer: true,
        footnote: `${i18n('Default')}: ${rpcPort} (${i18n('Bitcoin Core uses 8332')})`,
      }),
      peerport: Value.number({
        name: i18n('P2P Port'),
        description: i18n(
          'Peer-to-peer port advertised to other Elektron Net nodes. Other nodes can still reach you on a non-default port (the port is gossipped via addr messages).',
        ),
        required: false,
        default: peerPortExternal,
        min: 1024,
        max: 65535,
        integer: true,
        footnote: `${i18n('Default')}: ${peerPortExternal} (${i18n('Bitcoin Core uses 8333')})`,
      }),
      zmqblockport: Value.number({
        name: i18n('ZMQ Block Port'),
        description: i18n(
          'ZeroMQ publication port for block notifications (rawblock + hashblock).',
        ),
        required: false,
        default: zmqPortBlock,
        min: 1024,
        max: 65535,
        integer: true,
        footnote: `${i18n('Default')}: ${zmqPortBlock} (${i18n('Bitcoin Core uses 28332')})`,
      }),
      zmqtxport: Value.number({
        name: i18n('ZMQ Transaction Port'),
        description: i18n(
          'ZeroMQ publication port for transaction and sequence notifications (rawtx + hashtx + sequence).',
        ),
        required: false,
        default: zmqPortTransaction,
        min: 1024,
        max: 65535,
        integer: true,
        footnote: `${i18n('Default')}: ${zmqPortTransaction} (${i18n('Bitcoin Core uses 28333')})`,
      }),
    }),
  ),
  persistmempool: Value.triState({
    name: i18n('Persist Mempool'),
    description: i18n('Save the mempool on shutdown and load on restart.'),
    default: null,
    footnote: `${i18n('Default')}: true`,
  }),
  maxmempool: Value.number({
    name: i18n('Max Mempool Size'),
    description: i18n('Keep the transaction memory pool below <n> megabytes.'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: 'MiB',
    footnote: `${i18n('Default')}: 300 MiB`,
  }),
  mempoolexpiry: Value.number({
    name: i18n('Mempool Expiration'),
    description: i18n(
      'Do not keep transactions in the mempool longer than <n> hours.',
    ),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: i18n('Hr'),
    footnote: `${i18n('Default')}: 336 Hr`,
  }),
  permitbaremultisig: Value.triState({
    name: i18n('Permit Bare Multisig'),
    description: i18n('Relay non-P2SH multisig transactions'),
    default: null,
    footnote: `${i18n('Default')}: true`,
  }),
  datacarrier: Value.triState({
    name: i18n('Relay OP_RETURN Transactions'),
    description: i18n('Relay transactions with OP_RETURN outputs'),
    default: null,
    footnote: `${i18n('Default')}: true`,
  }),
  datacarriersize: Value.number({
    name: i18n('Max OP_RETURN Size'),
    description: i18n('Maximum size of data in OP_RETURN outputs to relay'),
    required: false,
    default: null,
    min: 0,
    max: 100_000,
    integer: true,
    units: i18n('bytes'),
    footnote: `${i18n('Default')}: 100000 bytes`,
  }),
  zmqEnabled: Value.triState({
    name: i18n('ZeroMQ Enabled'),
    description: i18n(
      'The ZeroMQ interface is useful for some applications which might require data related to block and transaction events from Elektron Net. For example, LND requires ZeroMQ be enabled for LND to get the latest block data',
    ),
    default: true,
    footnote: `${i18n('Default')}: false`,
  }),
  blocknotify: Value.text({
    name: i18n('Block Notify'),
    required: false,
    default: null,
    description: i18n(
      'Execute an arbitrary command when the best block changes',
    ),
  }),
  prune: Value.hidden(
    z
      .union([
        z.array(z.string()).transform((a) => Number(a.at(-1))),
        z.string().transform(Number),
        z.number(),
      ])
      .transform((v) => (v > 0 && v < minPrune ? minPrune : v))
      .catch(minPrune),
  ),
  txindex: Value.hidden(iniBoolean),
  coinstatsindex: Value.hidden(iniBoolean),
  wallet: Value.object(
    { name: i18n('Wallet'), description: i18n('Wallet Settings') },
    InputSpec.of({
      enable: Value.triState({
        name: i18n('Enable Wallet'),
        description: i18n('Load the wallet and enable wallet RPC calls.'),
        default: null,
        footnote: `${i18n('Default')}: true`,
      }),
      avoidpartialspends: Value.triState({
        name: i18n('Avoid Partial Spends'),
        description: i18n(
          'Group outputs by address, selecting all or none, instead of selecting on a per-output basis. This improves privacy at the expense of higher transaction fees.',
        ),
        default: null,
        footnote: `${i18n('Default')}: false`,
      }),
      discardfee: Value.number({
        name: i18n('Discard Change Tolerance'),
        description: i18n(
          'The fee rate (in ELEK/kB) that indicates your tolerance for discarding change by adding it to the fee.',
        ),
        required: false,
        default: null,
        min: 0,
        max: 0.01,
        integer: false,
        units: i18n('ELEK/kB'),
        footnote: `${i18n('Default')}: 0.0001 ELEK/kB`,
      }),
    }),
  ),
  dbcache: Value.number({
    name: i18n('Database Cache'),
    description: i18n(
      'How much RAM to allocate for caching the TXO set. Higher values improve syncing performance, but may result in some re-work in the event of an ungraceful shutdown. 4-7GB is high enough to get most of the peformance benefit during IBD. Consider reducing this setting for lower resource devices (or a device with less available RAM)',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: 'MiB',
    footnote: `${i18n('Default')}: ${i18n('1024 MiB on systems with ≥ 4 GiB RAM; 450 MiB otherwise')}`,
  }),
  dbbatchsize: Value.number({
    name: i18n('Database Batch'),
    description: i18n(
      'Maximum database write batch size in bytes. Higher values will speed up the critical sections when the utxo set is written to disk from memory in big batches.',
    ),
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: i18n('Bytes'),
    footnote: `${i18n('Default')}: 16777216 Bytes`,
  }),
  blockfilters: Value.object(
    {
      name: i18n('Block Filters'),
      description: i18n(
        'Settings for storing and serving compact block filters',
      ),
    },
    InputSpec.of({
      blockfilterindex: Value.triState({
        name: i18n('Compute Compact Block Filters (BIP158)'),
        description: i18n(
          "Generate Compact Block Filters during initial sync (IBD) to enable 'getblockfilter' RPC. This is useful if dependent services need block filters to efficiently scan for addresses/transactions etc.",
        ),
        default: true,
        footnote: `${i18n('Default')}: false`,
      }),
      peerblockfilters: Value.triState({
        name: i18n('Serve Compact Block Filters to Peers (BIP157)'),
        description: i18n(
          "Serve Compact Block Filters as a peer service to other nodes on the network. This is useful if you wish to connect an SPV client to your node to make it efficient to scan transactions without having to download all block data.  'Compute Compact Block Filters (BIP158)' is required.",
        ),
        default: null,
        footnote: `${i18n('Default')}: false`,
      }),
    }),
  ),
  peerbloomfilters: Value.triState({
    name: i18n('Serve Bloom Filters to Peers'),
    description: i18n(
      'Peers have the option of setting filters on each connection they make after the version handshake has completed. Bloom filters are for clients implementing SPV (Simplified Payment Verification) that want to check that block headers  connect together correctly, without needing to verify the full blockchain.  The client must trust that the transactions in the chain are in fact valid.  It is highly recommended AGAINST using for anything except Bisq integration.',
    ),
    warning: i18n(
      'This is ONLY for use with Bisq integration, please use Block Filters for all other applications.',
    ),
    default: null,
    footnote: `${i18n('Default')}: false`,
  }),
  onlynet: Value.multiselect({
    name: i18n('Onlynet'),
    description: i18n(
      'Make automatic outbound connections only to the selected networks. Inbound and manual connections are not affected by this option.',
    ),
    values: Object.fromEntries(
      validNets.map((n) => [n, n === 'onion' ? 'onion (Tor)' : n]),
    ) as Record<ValidNets, string>,
    default: [],
  }),
  v2transport: Value.triState({
    name: i18n('Use V2 P2P Transport Protocol'),
    description: i18n(
      'Enable or disable the use of BIP324 V2 P2P transport protocol.',
    ),
    default: null,
    footnote: `${i18n('Default')}: true`,
  }),
  privatebroadcast: Value.triState({
    name: i18n('Private Broadcast'),
    description: i18n(
      'When enabled, transactions submitted via the sendrawtransaction RPC are broadcast over a separate Tor or I2P connection per transaction, hiding the originator IP from peers and unlinking multiple transactions from the same sender. Only affects sendrawtransaction; internal wallet sends are unaffected.',
    ),
    default: null,
    footnote: `${i18n('Default')}: false`,
    warning: i18n(
      'Requires Tor or I2P to be active. Elektron Net will refuse to start if neither is available.',
    ),
  }),
  connectpeer: Value.union({
    name: i18n('Connect Peer'),
    default: 'addnode',
    variants: Variants.of({
      connect: {
        name: i18n('Connect'),
        spec: InputSpec.of({
          peers: Value.list(
            List.text(
              {
                name: i18n('Connect Nodes'),
                minLength: 1,
                description: i18n(
                  'Add addresses of nodes for Elektron Net to EXCLUSIVELY connect to.',
                ),
              },
              {
                patterns: [
                  {
                    regex:
                      '(^s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?:[0-9]{1,5}))s*$)|(^s*((?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*.?:[0-9]{1,5})s*$)|(^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?:[0-9]{1,5}s*$)',
                    description: i18n(
                      "Must be either a domain name, or an IPv4 or IPv6 address. Be sure to include the port number, but do not include protocol scheme (eg 'http://').",
                    ),
                  },
                ],
              },
            ),
          ),
        }),
      },
      addnode: {
        name: i18n('Add Node'),
        spec: InputSpec.of({
          peers: Value.list(
            List.text(
              {
                name: i18n('Add Nodes'),
                description: i18n(
                  'Add addresses of nodes for Elektron Net to connect with in addition to default nodes.',
                ),
              },
              {
                inputmode: 'text',
                patterns: [
                  {
                    regex:
                      '(^s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?:[0-9]{1,5}))s*$)|(^s*((?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*.?:[0-9]{1,5})s*$)|(^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?:[0-9]{1,5}s*$)',
                    description: i18n(
                      "Must be either a domain name, or an IPv4 or IPv6 address. Be sure to include the port number, but do not include protocol scheme (eg 'http://').",
                    ),
                  },
                ],
              },
            ),
          ),
        }),
      },
    }),
  }),
  maxconnections: Value.number({
    name: i18n('Maximum Connections'),
    description: i18n(
      'Set the maximum number of connections to maintain with peers.',
    ),
    default: null,
    required: false,
    min: 0,
    integer: true,
    footnote: `${i18n('Default')}: 125`,
  }),
  blocksonly: Value.triState({
    name: i18n('Blocks Only'),
    description: i18n(
      'Reduce bandwidth by not relaying transactions. Blocks will still be downloaded and validated normally. Disables the mempool, wallet transaction broadcasting, and fee estimation.',
    ),
    default: null,
    footnote: `${i18n('Default')}: false`,
  }),
  rpcservertimeout: Value.number({
    name: i18n('Rpc Server Timeout'),
    description: i18n(
      'Number of seconds after which an uncompleted RPC call will time out.',
    ),
    required: false,
    default: null,
    min: 5,
    max: 300,
    integer: true,
    units: i18n('seconds'),
    footnote: `${i18n('Default')}: 30 seconds`,
  }),
  rpcthreads: Value.number({
    name: i18n('Threads'),
    description: i18n(
      'Set the number of threads for handling RPC calls. You may wish to increase this if you are making lots of calls via an integration.',
    ),
    required: false,
    default: null,
    min: 4,
    max: 64,
    integer: true,
    units: i18n('Threads').toLocaleLowerCase(),
    footnote: `${i18n('Default')}: 16 threads`,
  }),
  rpcworkqueue: Value.number({
    name: i18n('Work Queue'),
    description: i18n(
      'Set the depth of the work queue to service RPC calls. Determines how long the backlog of RPC requests can get before it just rejects new ones.',
    ),
    required: false,
    default: null,
    min: 8,
    max: 256,
    integer: true,
    units: i18n('requests'),
    footnote: `${i18n('Default')}: 64 requests`,
  }),
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const networking = {
    rpcport: input.rpcport ?? rpcPort,
    peerport: input.port ?? peerPortExternal,
    zmqblockport: parseZmqPort(input.zmqpubrawblock) ?? zmqPortBlock,
    zmqtxport: parseZmqPort(input.zmqpubrawtx) ?? zmqPortTransaction,
  }
  const {
    persistmempool,
    maxmempool,
    mempoolexpiry,
    permitbaremultisig,
    datacarrier,
    datacarriersize,
    zmqpubhashblock,
    zmqpubhashtx,
    zmqpubrawblock,
    zmqpubrawtx,
    zmqpubsequence,
    txindex,
    coinstatsindex,
    disablewallet,
    avoidpartialspends,
    discardfee,
    blocknotify,
    prune,
    dbcache,
    dbbatchsize,
    blockfilterindex,
    peerblockfilters,
    peerbloomfilters,
    onlynet,
    v2transport,
    privatebroadcast,
    connect,
    addnode,
    maxconnections,
    blocksonly,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
  } = input

  return {
    raw: input ?? {},
    networking,
    persistmempool,
    maxmempool,
    mempoolexpiry,
    permitbaremultisig,
    datacarrier,
    datacarriersize,
    zmqEnabled: !!(
      zmqpubhashblock &&
      zmqpubhashtx &&
      zmqpubrawblock &&
      zmqpubrawtx &&
      zmqpubsequence
    ),
    txindex,
    coinstatsindex,
    wallet: {
      enable: !disablewallet,
      avoidpartialspends,
      discardfee,
    },
    blocknotify,
    prune,
    dbcache: dbcache ?? null,
    dbbatchsize: dbbatchsize ?? null,
    blockfilters: {
      blockfilterindex: blockfilterindex === 'basic',
      peerblockfilters,
    },
    peerbloomfilters,
    onlynet: onlynet
      ? [onlynet]
          .flat()
          .filter(
            (x): x is ValidNets =>
              x !== undefined && (validNets as readonly string[]).includes(x),
          )
      : undefined,
    v2transport,
    privatebroadcast,
    connectpeer: {
      selection:
        connect !== undefined ? ('connect' as const) : ('addnode' as const),
      value: {
        peers:
          connect !== undefined
            ? [connect].flat().filter((x): x is string => x !== undefined)
            : [addnode].flat().filter((x): x is string => x !== undefined),
      },
    },
    maxconnections,
    blocksonly,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
  }
}

// @TODO: formToFile and fileToForm have no exhaustiveness check — if a new field
// is added to fullConfigSpec, TypeScript won't warn that it's missing here.
function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const ports = resolvePorts(input.networking)
  const {
    raw,
    persistmempool,
    maxmempool,
    mempoolexpiry,
    permitbaremultisig,
    datacarrier,
    datacarriersize,
    prune,
    wallet,
    txindex,
    coinstatsindex,
    peerbloomfilters,
    blockfilters,
    blocknotify,
    dbcache,
    dbbatchsize,
    zmqEnabled,
    v2transport,
    privatebroadcast,
    onlynet,
    connectpeer,
    maxconnections,
    blocksonly,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
  } = input

  return {
    ...raw,

    rpccookiefile: '.cookie',
    listen: true,
    bind: `0.0.0.0:${peerPortInternal}`,
    whitebind: `0.0.0.0:${ports.peer}`,
    port: ports.peer,
    rpcport: ports.rpc,
    rpcauth: raw?.rpcauth?.filter((a) => !!a) as string[] | undefined,
    whitelist: raw?.whitelist?.filter((a) => !!a) as string[] | undefined,
    externalip: raw?.externalip?.filter((a) => !!a) as string[] | undefined,

    // Mempool
    persistmempool: persistmempool ?? undefined,
    maxmempool: maxmempool ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,
    permitbaremultisig: permitbaremultisig ?? undefined,
    datacarrier: datacarrier ?? undefined,
    datacarriersize: datacarriersize ?? undefined,

    // RPC
    rpcbind: rpcBindFor({ prune: !!prune, rpcPort: ports.rpc }),
    rpcallowip: prune ? rpcallowipPruned : rpcallowip,

    // Wallet
    disablewallet: wallet?.enable == null ? undefined : !wallet.enable,
    avoidpartialspends: wallet?.avoidpartialspends ?? undefined,
    discardfee: wallet?.discardfee ?? undefined,

    // Other
    txindex: prune ? false : (txindex ?? undefined),
    coinstatsindex: coinstatsindex ?? undefined,
    peerbloomfilters: peerbloomfilters ?? undefined,
    peerblockfilters: blockfilters?.peerblockfilters ?? undefined,
    blockfilterindex:
      blockfilters?.blockfilterindex == null
        ? undefined
        : blockfilters.blockfilterindex
          ? 'basic'
          : false,
    blocknotify: blocknotify || undefined,
    prune: prune ?? 0,
    dbcache: dbcache ?? undefined,
    dbbatchsize: dbbatchsize ?? undefined,
    // ZMQ
    ...(zmqEnabled === true
      ? buildZmqBundle(ports)
      : zmqEnabled === false
        ? {
            zmqpubrawblock: undefined,
            zmqpubhashblock: undefined,
            zmqpubrawtx: undefined,
            zmqpubhashtx: undefined,
            zmqpubsequence: undefined,
          }
        : {}),

    // Peer
    v2transport: v2transport ?? undefined,
    privatebroadcast: privatebroadcast ?? undefined,
    onlynet: onlynet?.length ? input.onlynet?.filter((a) => !!a) : undefined,
    connect:
      connectpeer?.selection === 'connect'
        ? (connectpeer.value?.peers?.filter((a) => !!a) as string[] | undefined)
        : undefined,
    addnode:
      connectpeer?.selection === 'addnode'
        ? (connectpeer.value?.peers?.filter((a) => !!a) as string[] | undefined)
        : undefined,
    maxconnections: maxconnections ?? undefined,
    blocksonly: blocksonly ?? undefined,

    // RPC
    rpcservertimeout: rpcservertimeout ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
    rpcworkqueue: rpcworkqueue ?? undefined,
  }
}

export const bitcoinConfFile = FileHelper.ini(
  {
    base: sdk.volumes.main,
    subpath: '/bitcoin.conf',
  },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => {
      const base = shape.parse(a)
      return fileToForm(base)
    },
    onWrite: (a) => {
      return stringifyPrimitives(formToFile(a))
    },
  },
)
