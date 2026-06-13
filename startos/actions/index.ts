import { sdk } from '../sdk'
import { autoconfig } from './config/autoconfig'
import { mempoolConfig } from './config/mempool'
import { otherConfig } from './config/other'
import { peerConfig } from './config/peers'
import { rpcConfig } from './config/rpc'
import { deletePeers } from './deletePeers'
import { deleteRpcAuth } from './deleteRpcAuth'
import { generateRpcUser } from './generateRpcUser'
import { generateRpcUserDependent } from './generateRpcUserDependent'
import { reindexBlockchain } from './reindexBlockchain'
import { reindexChainstate } from './reindexChainstate'
import { runtimeInfo } from './runtimeInfo'
export const actions = sdk.Actions.of()
  .addAction(mempoolConfig)
  .addAction(peerConfig)
  .addAction(rpcConfig)
  .addAction(deletePeers)
  .addAction(deleteRpcAuth)
  .addAction(generateRpcUser)
  .addAction(generateRpcUserDependent)
  .addAction(otherConfig)
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(runtimeInfo)
  .addAction(autoconfig)
