import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import {
  peerPortExternal,
  peerPortInternal,
  rpcallowip,
  rpcbind,
  rpccookiefile,
} from '../utils'

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

export const shape = z.object({
  rpcbind: z.string().catch(rpcbind),
  rpcallowip: z.string().catch(rpcallowip),
  rpccookiefile: z.literal(rpccookiefile).catch(rpccookiefile),
  listen: z.literal(true).catch(true),
  bind: z.literal(`0.0.0.0:${peerPortInternal}`).catch(`0.0.0.0:${peerPortInternal}`),
  whitebind: z.literal(`0.0.0.0:${peerPortExternal}`).catch(`0.0.0.0:${peerPortExternal}`),
  rpcauth: iniStringArray,
  txindex: iniBoolean,
  dbcache: iniNumber,
  prune: z
    .union([
      z.array(z.string()).transform((a) => Number(a.at(-1))),
      z.string().transform(Number),
      z.number(),
    ])
    .catch(0),
  maxconnections: iniNumber,
  addnode: iniStringArray,
  externalip: iniStringArray,
  zmqpubrawblock: iniString,
  zmqpubhashblock: iniString,
  zmqpubrawtx: iniString,
  zmqpubhashtx: iniString,
  zmqpubsequence: iniString,
})

export const bitcoinConfFile = FileHelper.ini(
  {
    base: sdk.volumes.main,
    subpath: '/elektron.conf',
  },
  shape,
  { bracketedArray: false },
  {
    onRead: (a) => shape.parse(a),
    onWrite: (a) => a,
  },
)
