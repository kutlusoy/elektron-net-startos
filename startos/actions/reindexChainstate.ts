import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const reindexChainstate = sdk.Action.withoutInput(
  'reindex-chainstate',
  async () => ({
    name: 'Reindex Chainstate',
    description: 'Rebuilds the chainstate database only.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Reindex',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await storeJson.merge(effects, { reindexChainstate: true })
    const status = await sdk.getStatus(effects, { packageId: 'elektrond' }).once()
    if (status?.desired.main === 'running') {
      await sdk.restart(effects)
    }
    return {
      version: '1' as const,
      title: 'Success',
      message: 'Chainstate reindex queued.',
      result: null,
    }
  },
)
