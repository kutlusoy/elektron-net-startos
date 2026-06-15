import {
  bitcoinConfFile,
  defaultDbbatchsize,
  defaultDbcache,
  minPrune,
} from '../fileModels/bitcoin.conf'
import { i2pdConfFile } from '../fileModels/i2pd.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { i2PSamAddress } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return

  // install, update, restore
  await storeJson.merge(effects, {})
  await i2pdConfFile.merge(effects, {})

  if (kind === 'install') {
    await bitcoinConfFile.merge(effects, {
      zmqEnabled: true,
      blockfilters: { blockfilterindex: true },
      dbcache: defaultDbcache(),
      dbbatchsize: defaultDbbatchsize(),
      prune: minPrune,
      raw: {
        i2psam: i2PSamAddress,
        // --- Log-Cap: debug.log klein halten ---
        debug: '0', // disable alle debug-Kategorien (Default: alle an)
        shrinkdebugfile: true, // bei jedem Daemon-Start auf 200KB schrumpfen
        logips: false, // keine IP-Adressen in Logs (Privacy + Size)
        logsourcelocations: false, // keine src/file:line Annotationen
      },
    })
  } else {
    await bitcoinConfFile.merge(effects, {})
  }
})