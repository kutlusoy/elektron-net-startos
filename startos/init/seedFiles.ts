import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { totalmem } from 'os'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return
  await storeJson.merge(effects, {})
  if (kind === 'install') {
    await bitcoinConfFile.merge(effects, {
      dbcache: Math.min(Math.floor((totalmem() * 0.25) / (1024 * 1024)), 5120),
      prune: 0,
    })
  } else {
    await bitcoinConfFile.merge(effects, {})
  }
})
