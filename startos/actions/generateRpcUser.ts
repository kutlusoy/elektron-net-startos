import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { T } from '@start9labs/start-sdk'

export const generateRpcUser = sdk.Action.withoutInput(
  'generate-rpcuser',
  async () => ({
    name: 'Generate RPC Credentials',
    description: 'Generate a new RPC username and password',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'RPC',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const username = 'elektron'
    const conf = await bitcoinConfFile.read().const(effects)
    const existing = conf?.rpcauth ?? []
    const rpcAuthEntries = [
      ...existing.filter((a): a is string => !!a && !a.startsWith(`${username}:`)),
      `${username}:${password}`,
    ]
    await bitcoinConfFile.merge(effects, { rpcauth: rpcAuthEntries })
    return {
      version: '1' as const,
      title: 'RPC Credentials Generated',
      message: null,
      result: {
        type: 'group' as const,
        name: 'Credentials',
        description: null,
        value: [
          { type: 'single' as const, name: 'Username', description: null, value: username, copyable: true, masked: false, qr: false },
          { type: 'single' as const, name: 'Password', description: null, value: password, copyable: true, masked: true, qr: false },
        ] as T.ActionResultMember[],
      },
    }
  },
)
