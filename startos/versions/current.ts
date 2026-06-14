import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '4.0.0:0',
  releaseNotes: {
    en_US: 'Initial StartOS packaging for Elektron Net.',
    de_DE: 'Erste StartOS-Paket für Elektron Net.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
