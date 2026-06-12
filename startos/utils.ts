import { sdk } from './sdk'
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const zmqInterfaceId = 'zmq'
export const zmqPortBlock = 28332
export const zmqPortTransaction = 28333
export const peerPortExternal = 8333
export const peerPortInternal = 58333
export const rpcPort = 8332
export const rpcPortPruned = 58332
export const rpcbind = `0.0.0.0:${rpcPort}`
export const rpcbindPruned = `127.0.0.1:${rpcPortPruned}`
export const rpcallowip = '0.0.0.0/0'
export const rpcallowipPruned = '127.0.0.1/32'
export const rootDir = '/root/.elektron'
export const rpccookiefile = '.cookie'
export const elektronMounts = sdk.Mounts.of().mountVolume({
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
  verificationprogress: number
  initialblockdownload: boolean
  size_on_disk: number
  pruned: boolean
  warnings: string
  softforks: Record<string, { type: string; active: boolean; height?: number; bip9?: any }>
}
export const ipcSocketPath = `unix:${rootDir}/ipc/elektron.sock`
export function rpcArgs(opts: { prune: boolean }): string[] {
  return [
    `-conf=${rootDir}/elektron.conf`,
    `-rpccookiefile=${rootDir}/.cookie`,
    `-rpcport=${opts.prune ? rpcPortPruned : rpcPort}`,
  ]
}
export function elektronCliArgs(opts: { prune: boolean }): string[] {
  return ['/opt/elektron/bin/elektron-cli', ...rpcArgs(opts)]
}
export const zmqBundle = {
  zmqpubrawblock: `tcp://0.0.0.0:${zmqPortBlock}`,
  zmqpubhashblock: `tcp://0.0.0.0:${zmqPortBlock}`,
  zmqpubrawtx: `tcp://0.0.0.0:${zmqPortTransaction}`,
  zmqpubhashtx: `tcp://0.0.0.0:${zmqPortTransaction}`,
  zmqpubsequence: `tcp://0.0.0.0:${zmqPortTransaction}`,
}
