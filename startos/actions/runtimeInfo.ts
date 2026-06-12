import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { elektronCliArgs, elektronMounts, GetBlockchainInfo, GetNetworkInfo } from '../utils'

export const runtimeInfo = sdk.Action.withoutInput(
  'runtime-info',
  async () => ({
    name: 'Runtime Information',
    description: 'Network and blockchain runtime information about this Elektron node',
    warning: null,
    allowedStatuses: 'only-running' as const,
    group: null,
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    const networkInfoRes = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'elektrond' },
      elektronMounts,
      'getnetworkinfo',
      async (subc) => subc.execFail([...elektronCliArgs({ prune: false }), 'getnetworkinfo']),
    )
    const networkInfo: GetNetworkInfo = JSON.parse(networkInfoRes.stdout as string)

    const blockchainInfoRes = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'elektrond' },
      elektronMounts,
      'getblockchaininfo',
      async (subc) => subc.execFail([...elektronCliArgs({ prune: false }), 'getblockchaininfo']),
    )
    const blockchainInfo: GetBlockchainInfo = JSON.parse(blockchainInfoRes.stdout as string)

    return {
      version: '1' as const,
      title: 'Elektron Node Runtime Info',
      message: null,
      result: {
        type: 'group' as const,
        name: 'Runtime Info',
        description: null,
        value: [
          { type: 'single' as const, name: 'Connections', description: null, value: `${networkInfo.connections} (${networkInfo.connections_in} in / ${networkInfo.connections_out} out)`, copyable: false, masked: false, qr: false },
          { type: 'single' as const, name: 'Block Height', description: null, value: String(blockchainInfo.headers), copyable: false, masked: false, qr: false },
          { type: 'single' as const, name: 'Synced Height', description: null, value: String(blockchainInfo.blocks), copyable: false, masked: false, qr: false },
          { type: 'single' as const, name: 'Sync Progress', description: null, value: blockchainInfo.blocks < blockchainInfo.headers || blockchainInfo.blocks === 0 ? `${(blockchainInfo.verificationprogress * 100).toFixed(2)}%` : '100%', copyable: false, masked: false, qr: false },
        ] as T.ActionResultMember[],
      },
    }
  },
)
