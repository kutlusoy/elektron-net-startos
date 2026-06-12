import { sdk } from '../sdk'
import { deletePeers } from './deletePeers'
import { deleteRpcAuth } from './deleteRpcAuth'
import { generateRpcUser } from './generateRpcUser'
import { reindexBlockchain } from './reindexBlockchain'
import { reindexChainstate } from './reindexChainstate'
import { runtimeInfo } from './runtimeInfo'

export const actions = sdk.Actions.of()
  .addAction(deletePeers)
  .addAction(deleteRpcAuth)
  .addAction(generateRpcUser)
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(runtimeInfo)
