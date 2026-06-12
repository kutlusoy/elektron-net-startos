import { sdk } from './sdk'
import {
  peerInterfaceId,
  peerPortExternal,
  peerPortInternal,
  rpcInterfaceId,
  rpcPort,
  zmqInterfaceId,
  zmqPortBlock,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const receipts = []

  const rpcMulti = sdk.MultiHost.of(effects, 'rpc')
  const rpcOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: 'RPC Interface',
    id: rpcInterfaceId,
    description: 'Listens for JSON-RPC commands',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await rpcOrigin.export([rpc]))

  const peerMulti = sdk.MultiHost.of(effects, 'peer')
  const peerOrigin = await peerMulti.bindPort(peerPortInternal, {
    protocol: null,
    preferredExternalPort: peerPortExternal,
    addSsl: null,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: 'Peer Interface',
    id: peerInterfaceId,
    description: 'Listens for incoming connections from peers on the Elektron network',
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await peerOrigin.export([peer]))

  const zmqMulti = sdk.MultiHost.of(effects, 'zmq')
  const zmqOrigin = await zmqMulti.bindPort(zmqPortBlock, {
    preferredExternalPort: zmqPortBlock,
    addSsl: null,
    secure: { ssl: false },
    protocol: null,
  })
  const zmq = sdk.createInterface(effects, {
    name: 'ZeroMQ Interface',
    id: zmqInterfaceId,
    description: 'Streams real-time Elektron block and transaction notifications',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await zmqOrigin.export([zmq]))

  return receipts
})
