import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'

export const deleteRpcAuth = sdk.Action.withoutInput(
  'delete-rpcauth',
  async () => ({
    name: 'Delete RPC Credentials',
    description: 'Removes all saved RPC credentials.',
    warning: 'Any services using these credentials will lose access.',
    allowedStatuses: 'any' as const,
    group: 'RPC',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await bitcoinConfFile.merge(effects, { rpcauth: [] })
    return {
      version: '1' as const,
      title: 'Success',
      message: 'RPC credentials deleted.',
      result: null,
    }
  },
)
