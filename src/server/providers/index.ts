import type { MapProvider, LlmProvider, BookingProvider } from './types.js'
import { MockMapProvider } from './mockMapProvider.js'
import { MockLlmProvider } from './mockLlmProvider.js'
import { MockBookingProvider } from './mockBookingProvider.js'

export interface ProviderContainer {
  map: MapProvider
  llm: LlmProvider
  booking: BookingProvider
}

export function createProviders(): ProviderContainer {
  return {
    map: new MockMapProvider(),
    llm: new MockLlmProvider(),
    booking: new MockBookingProvider(),
  }
}
