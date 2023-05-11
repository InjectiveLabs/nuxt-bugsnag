import path from 'node:path'

export default defineNuxtConfig({
  modules: ['../src/module'],
  bugsnag: {
    disabled: process.env.DISABLE_BUGSNAG === 'true' || false,
    publishRelease: true,
    disableLog: true,
    config: {
      notifyReleaseStages: ['staging', 'production', 'dev'],
      apiKey: '317c3d7013a3dc4a9e152138bfe8c900',
      environment: process.env.NODE_ENV
    },
    projectRoot: path.join(__dirname, '..')
  }
})
