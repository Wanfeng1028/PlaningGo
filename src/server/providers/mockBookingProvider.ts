import type { BookingItem, BookingProvider, BookingResult } from './types.js'

export class MockBookingProvider implements BookingProvider {
  private bookings = new Map<string, BookingResult & { createdAt: Date }>()

  async createBooking(item: BookingItem): Promise<BookingResult> {
    await new Promise((r) => setTimeout(r, Math.random() * 200 + 100))
    const code = `BK-${Date.now().toString(36).toUpperCase()}`
    const result: BookingResult & { createdAt: Date } = {
      confirmationCode: code,
      status: 'confirmed',
      item,
      estimatedCost: item.metadata?.['cost'] as number | undefined,
      notes: 'Mock booking confirmed',
      createdAt: new Date(),
    }
    this.bookings.set(code, result)
    return result
  }

  async cancelBooking(confirmationCode: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 100))
    const booking = this.bookings.get(confirmationCode)
    if (!booking) return { success: false }
    booking.status = 'confirmed'
    return { success: true }
  }

  async getBookingStatus(confirmationCode: string): Promise<{ status: string }> {
    const booking = this.bookings.get(confirmationCode)
    return { status: booking?.status || 'not_found' }
  }
}
