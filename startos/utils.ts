import { sdk } from './sdk'

export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const zmqInterfaceId = 'zmq'

// Defaults distinct from Bitcoin Core (8332/8333/28332/28333) to avoid
// host-port collisions when both packages are installed on the same StartOS.
// All four are user-overridable via the `networking` group in bitcoin.conf.
export const zmqPortBlock = 29432
export const zmqPortTransaction = 29433

export const peerPortExternal = 9433
export const peerPortInternal = 58333

export const rpcPort = 9432
export const rpcPortPruned = 58332

export const rpcallowip = '0.0.0.0/0'
export const rpcallowipPruned = '127.0.0.1/32'

export const rootDir = '/root/.elektron'
export const rpccookiefile = '.cookie'

export const i2pSamPort = 7656
export const i2pUiPort = 7070
export const i2pControlPort = 7650

export const i2PSamAddress = `127.0.0.1:${i2pSamPort}`

export const bitcoinMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

export type GetNetworkInfo = {
  connections: number
  connections_in: number
  connections_out: number
}

export type GetBlockchainInfo = {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  mediantime: number
  verificationprogress: number
  initialblockdownload: boolean
  chainwork: string
  size_on_disk: number
  pruned: boolean
  pruneheight?: number
  automatic_pruning?: boolean
  prune_target_size?: number
  softforks: Record<
    string,
    {
      type: string
      bip9?: {
        status: string
        bit?: number
        start_time: number
        timeout: number
        since: number
        statistics?: {
          period: number
          threshold: number
          elapsed: number
          count: number
          possible: boolean
        }
      }
      height?: number
      active: boolean
    }
  >
  warnings: string
}

export const ipcSocketPath = `unix:${rootDir}/ipc/elektron.sock`

export type NetworkingOverrides = {
  rpcport?: number | null
  peerport?: number | null
  zmqblockport?: number | null
  zmqtxport?: number | null
}

export type ResolvedPorts = {
  rpc: number
  peer: number
  zmqBlock: number
  zmqTx: number
}

export function resolvePorts(net?: NetworkingOverrides): ResolvedPorts {
  return {
    rpc: net?.rpcport ?? rpcPort,
    peer: net?.peerport ?? peerPortExternal,
    zmqBlock: net?.zmqblockport ?? zmqPortBlock,
    zmqTx: net?.zmqtxport ?? zmqPortTransaction,
  }
}

export function rpcBindFor(opts: { prune: boolean; rpcPort: number }): string {
  return opts.prune
    ? `127.0.0.1:${rpcPortPruned}`
    : `0.0.0.0:${opts.rpcPort}`
}

/** RPC connection args shared by elektron-cli and shell-script wrappers.
 *  In non-pruned mode the port is read from bitcoin.conf via -conf; we only
 *  inject -rpcport for the pruned proxy path. */
export function rpcArgs(opts: { prune: boolean }): string[] {
  const args = [
    `-conf=${rootDir}/bitcoin.conf`,
    `-rpccookiefile=${rootDir}/.cookie`,
  ]
  if (opts.prune) args.push(`-rpcport=${rpcPortPruned}`)
  return args
}

/** Full elektron-cli command prefix for actions running in temp subcontainers. */
export function bitcoinCliArgs(opts: { prune: boolean }): string[] {
  return ['elektron-cli', ...rpcArgs(opts)]
}

export function buildZmqBundle(ports: ResolvedPorts) {
  return {
    zmqpubrawblock: `tcp://0.0.0.0:${ports.zmqBlock}`,
    zmqpubhashblock: `tcp://0.0.0.0:${ports.zmqBlock}`,
    zmqpubrawtx: `tcp://0.0.0.0:${ports.zmqTx}`,
    zmqpubhashtx: `tcp://0.0.0.0:${ports.zmqTx}`,
    zmqpubsequence: `tcp://0.0.0.0:${ports.zmqTx}`,
  }
}

/** Default ZMQ URL bundle (used by code paths that don't have resolved ports). */
export const zmqBundle = buildZmqBundle(resolvePorts())

/** Extract the port number from a ZMQ URL like "tcp://0.0.0.0:29432". */
export function parseZmqPort(url: string | undefined): number | undefined {
  if (!url) return undefined
  const m = url.match(/:(\d+)\s*$/)
  return m ? Number(m[1]) : undefined
}
