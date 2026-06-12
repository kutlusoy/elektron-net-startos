import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'elektrond',
  title: 'Elektron',
  license: 'MIT',
  donationUrl: null,
  packageRepo: 'https://github.com/kutlusoy/elektron-net-startos',
  upstreamRepo: 'https://github.com/kutlusoy/elektron-net',
  marketingUrl: 'https://elektron-net.org/',
  description: {
    short: 'Elektron - A Bitcoin fork with 60-second blocks and 137-day UTXO expiry.',
    long: 'Elektron is a Bitcoin Core fork featuring 60-second block times, mandatory 137-day transaction history expiry (UTXO pruning), and GDPR-aligned right-to-be-forgotten design. Named after the Lydian electrum coin and grounded in Stoic philosophy and the fine-structure constant alpha = 137.',
  },
  volumes: ['main'],
  images: {
    elektrond: {
      source: {
        dockerBuild: {
          buildArgs: {},
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    uninstall: 'Uninstalling Elektron will delete your blockchain data and wallet.',
    restore: null,
  },
  dependencies: {
    tor: {
      description: 'Required for .onion peer connectivity.',
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
