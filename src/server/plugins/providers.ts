import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { createProviders } from '../providers/index.js'
import type { ProviderContainer } from '../providers/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    providers: ProviderContainer
  }
}

export default fp(
  async function providerPlugin(app: FastifyInstance) {
    const providers = createProviders()
    app.decorate('providers', providers)
    app.log.info('✅ Providers initialized')
  },
  { name: 'provider-plugin' }
)
