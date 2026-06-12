import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const storeSchema = z.object({
  reindexBlockchain: z.boolean().default(false),
  reindexChainstate: z.boolean().default(false),
  fullySynced: z.boolean().default(false),
  enableIpc: z.boolean().default(false),
  snapshotInUse: z.boolean().default(false),
})

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  storeSchema,
)
