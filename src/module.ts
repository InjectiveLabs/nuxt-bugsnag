import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  isNuxt3,
  extendViteConfig
} from '@nuxt/kit'
import { browser, node } from '@bugsnag/source-maps'
import { BrowserConfig } from '@bugsnag/js'

const { resolve } = createResolver(import.meta.url)

interface NodeUploadMultipleOpts {
  apiKey: string
  directory: string
  appVersion?: string
  codeBundleId?: string
  overwrite?: boolean
  projectRoot?: string
  endpoint?: string
  detectAppVersion?: boolean
  requestOpts?: any
  logger?: any
  idleTimeout?: number
}

interface BrowserUploadMultipleOpts {
  apiKey: string
  baseUrl: string
  directory: string
  appVersion?: string
  codeBundleId?: string
  overwrite?: boolean
  projectRoot?: string
  endpoint?: string
  detectAppVersion?: boolean
  idleTimeout?: number
  requestOpts?: any
  logger?: any
}
export interface ModuleOptions {
  disabled: boolean
  publishRelease: boolean
  baseUrl: string
  projectRoot: string
  config:
    | {
        apiKey: string
        notifyReleaseStages?: string[]
        environment?: string
        appVersion?: string
      }
    | Partial<BrowserConfig>
}

let nitroPublicConfig: BrowserUploadMultipleOpts = {
  apiKey: '',
  directory: '',
  baseUrl: ''
}
let nitroServerConfig: NodeUploadMultipleOpts = {
  apiKey: '',
  directory: ''
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-bugsnag',
    configKey: 'bugsnag',
    compatibility: {
      nuxt: '^3.0.0-rc.10 || ^3.0.0 || ^2.16.0',
      bridge: true
    }
  },
  defaults: {
    disabled: false,
    publishRelease: false,
    baseUrl: 'http://localhost:3000',
    config: {
      notifyReleaseStages: [],
      apiKey: '',
      environment: 'production',
      appVersion: '1.0.0'
    },
    projectRoot: '/'
  },
  hooks: {
    'imports:extend': (imports) => {
      imports.push({
        name: 'useBugsnag',
        as: 'useBugsnag',
        from: resolve('./runtime/composables/useBugsnag')
      })
    }
  },
  setup(options, nuxt) {
    if (options.disabled) {
      return
    }

    if (isNuxt3()) {
      nuxt.options.runtimeConfig.public.bugsnag = options.config as any
    } else {
      nuxt.options.publicRuntimeConfig.bugsnag = options.config as any
    }

    addPlugin(resolve('./runtime/plugin'))

    extendViteConfig((config) => {
      config.optimizeDeps?.include?.push(
        ...['@bugsnag/plugin-vue', '@bugsnag/js']
      )
    })

    if (!options.publishRelease || nuxt.options.dev) {
      return
    }

    nuxt.options.sourcemap = { server: true, client: true }

    nitroServerConfig = {
      apiKey: options.config.apiKey!,
      appVersion: options.config.appVersion,
      directory: nuxt.options.serverDir,
      logger: console,
      overwrite: true,
      projectRoot: options.projectRoot
    }

    nitroPublicConfig = {
      apiKey: options.config.apiKey!,
      appVersion: options.config.appVersion,
      directory: nuxt.options.serverDir.replace('server', 'public'),
      logger: console,
      overwrite: true,
      baseUrl: options.baseUrl
    }

    nuxt.hook('build:done', async () => {
      console.log('Source map upload to Bugsnag started \n')

      const promises = []
      promises.push(node.uploadMultiple(nitroServerConfig))
      promises.push(browser.uploadMultiple(nitroPublicConfig))

      await Promise.all(promises)

      console.log('Source map upload to Bugsnag completed \n')
    })
  }
})
