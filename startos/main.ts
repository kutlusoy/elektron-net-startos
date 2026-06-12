import { sdk } from './sdk'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { storeJson } from './fileModels/store.json'
import { elektronCliArgs, elektronMounts, rootDir, rpccookiefile, rpcPort } from './utils'
import { access, rm } from 'fs/promises'

export const main = sdk.setupMain(async ({ effects }) => {
  console.log('Starting Elektron!')

  const store = await storeJson.read().once()
  if (!store) throw new Error('No store')

  const elektronConf = await bitcoinConfFile.read().const(effects)
  if (!elektronConf) throw new Error('No elektron.conf')

  const { reindexBlockchain, reindexChainstate } = store

  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()
  const elektronArgs: string[] = torIp ? [`-onion=${torIp}:9050`] : []

  if (reindexBlockchain) {
    elektronArgs.push('-reindex')
    await storeJson.merge(effects, { reindexBlockchain: false })
  } else if (reindexChainstate) {
    elektronArgs.push('-reindex-chainstate')
    await storeJson.merge(effects, { reindexChainstate: false })
  }

  const elektronSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'elektrond' },
    elektronMounts,
    'elektrond-sub',
  )

  const rpcCookiePath = `${rootDir}/${rpccookiefile}`

  await rm(`${elektronSub.rootfs}${rpcCookiePath}`, {
    force: true,
    recursive: true,
  })

  return sdk.Daemons.of(effects)
    .addDaemon('elektrond', {
      subcontainer: elektronSub,
      exec: {
        command: ['/opt/elektron/bin/elektrond', ...elektronArgs],
        sigtermTimeout: 300_000,
      },
      ready: {
        display: 'RPC',
        fn: async () => {
          try {
            await access(`${elektronSub.rootfs}${rpcCookiePath}`)
          } catch {
            return {
              message: 'The Elektron RPC Interface is not ready',
              result: 'starting',
            }
          }
          return sdk.healthCheck.checkPortListening(effects, rpcPort, {
            successMessage: 'The Elektron RPC Interface is ready',
            errorMessage: 'The Elektron RPC Interface is not ready',
          })
        },
      },
      requires: [],
    })
    .addHealthCheck('tor', {
      ready: {
        display: 'Tor',
        fn: () => {
          if (!torIp) return { result: 'disabled', message: 'Tor is not installed' }
          return { result: 'success', message: 'Tor is active' }
        },
      },
      requires: [],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: 'Blockchain Sync',
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: async () => {
          const res = await elektronSub.exec([
            ...elektronCliArgs({ prune: false }),
            '-rpcconnect=127.0.0.1',
            'getblockchaininfo',
          ])
          if (res.exitCode === 0 && res.stdout && typeof res.stdout === 'string') {
            const info = JSON.parse(res.stdout)
            if (info.initialblockdownload) {
              const pct = (info.verificationprogress * 100).toFixed(2)
              return { message: `Syncing blocks... ${pct}%`, result: 'loading' }
            }
            return { message: 'Elektron is fully synced', result: 'success' }
          }
          return { message: 'Elektron is starting...', result: 'starting' }
        },
      },
      requires: ['elektrond'],
    })
})
