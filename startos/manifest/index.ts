import { setupManifest } from '@start9labs/start-sdk'
import {
  alertRestore,
  alertUninstall,
  long,
  short,
  torDescription,
} from './i18n'

export const manifest = setupManifest({
  id: 'elektrond',
  title: 'Elektron',
  license: 'MIT',
  donationUrl: null,
  packageRepo:
    'https://github.com/kutlusoy/elektron-net-startos',
  upstreamRepo: 'https://github.com/kutlusoy/elektron-net',
  marketingUrl: 'https://elektron-net.org/',
  description: { short, long },
  volumes: ['main', 'i2pd'],
  images: {
    elektrond: {
      source: {
        dockerBuild: {
          buildArgs: {
            VERSION: '0.1.0',
          },
        },
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    python: {
      source: {
        dockerTag: 'python:3.14.2-alpine',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    i2pd: {
      source: {
        dockerTag: 'purplei2p/i2pd:release-2.58.0',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'x86_64',
    },
  },
  alerts: {
    uninstall: alertUninstall,
    restore: alertRestore,
  },
  dependencies: {
    tor: {
      description: torDescription,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
