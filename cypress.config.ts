import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'uckcr1',
  viewportWidth: 1200,
  viewportHeight: 800,
  // defaultCommandTimeout: 40000,
  // pageLoadTimeout: 120000,
  video: false,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  experimentalStudio: true,
  chromeWebSecurity: false,
  numTestsKeptInMemory: 2,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
