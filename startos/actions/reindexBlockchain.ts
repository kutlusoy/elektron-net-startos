import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const reindexBlockchain = sdk.Action.withoutInput(
  'reindex-blockchain',
  async () => ({
    name: 'Reindex Blockchain',
    description: 'Rebuilds the block and chainstate databases starting from genesis.',
    warning: 'This process could take a long time.',
    allowedStatuses: 'any' as const,
    group: 'Reindex',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await storeJson.merge(effects, { reindexBlockchain: true, fullySynced: false })
    const status = await sdk.getStatus(effects, { packageId: 'elektrond' }).once()
    if (status?.desired.main === 'running') {
      await sdk.restart(effects)
    }
    return {
      version: '1' as const,
      title: 'Success',
      message: 'Reindex queued. Restarting Elektron.',
      result: null,
    }
  },
)
