import { sdk } from '../sdk'
import { elektronMounts, rootDir } from '../utils'

export const deletePeers = sdk.Action.withoutInput(
  'delete-peers',
  async () => ({
    name: 'Delete Peer List',
    description: 'Deletes the list of known peers (peers.dat). Useful if you are having connection issues.',
    warning: null,
    allowedStatuses: 'only-stopped' as const,
    group: 'Peers',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'elektrond' },
      elektronMounts,
      'delete-peers',
      async (subc) => {
        await subc.exec(['rm', '-f', `${rootDir}/peers.dat`])
      },
    )
    return {
      version: '1' as const,
      title: 'Success',
      message: 'Peer list deleted.',
      result: null,
    }
  },
)
