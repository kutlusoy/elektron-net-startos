import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '4.0.2:0',
  releaseNotes: {
    en_US: 'StartOS for Elektron Net v4.0.2:0.',
    de_DE: 'StartOS für Elektron Net v4.0.2:0.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
