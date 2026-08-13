import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function validateEventDateRequirement(startDate) {
  if (!startDate || typeof startDate !== 'string') {
    return { valid: false, needsFullDate: true, reason: 'Fecha requerida' }
  }
  const hasYear = /\b20\d{2}\b/.test(startDate) || /\b\d{4}-\d{2}-\d{2}\b/.test(startDate)
  if (!hasYear) {
    return { valid: false, needsFullDate: true, reason: 'Se requiere año completo' }
  }
  return { valid: true, needsFullDate: false }
}

function parseCulturalEvent(rawEvent, isLiveVerified = false) {
  return {
    id: rawEvent.id || `event-${Date.now()}`,
    name: String(rawEvent.name || rawEvent.title || '').trim(),
    dateTime: rawEvent.dateTime || rawEvent.startsAt || '',
    location: rawEvent.location || '',
    source: rawEvent.source || (isLiveVerified ? 'Tavily Search' : 'Tentative Source'),
    verificationStatus: isLiveVerified ? 'verified' : 'pending_confirmation'
  }
}

describe('Cultural Events Unit Tests', () => {
  it('should reject event queries missing year and request full travel dates', () => {
    const res = validateEventDateRequirement('15 de septiembre')
    assert.equal(res.valid, false)
    assert.equal(res.needsFullDate, true)
  })

  it('should accept event queries with complete date including year', () => {
    const res = validateEventDateRequirement('2026-09-15')
    assert.equal(res.valid, true)
    assert.equal(res.needsFullDate, false)
  })

  it('should tag verified event with verificationStatus="verified"', () => {
    const event = parseCulturalEvent({
      id: 'event-bcn-1',
      name: 'La Mercè Festival 2026',
      dateTime: '2026-09-24',
      location: 'Plaça de Sant Jaume, Barcelona',
      source: 'Official Barcelona Tourism API'
    }, true)

    assert.equal(event.verificationStatus, 'verified')
    assert.equal(event.name, 'La Mercè Festival 2026')
    assert.equal(event.dateTime, '2026-09-24')
  })

  it('should tag unverified/tentative event with verificationStatus="pending_confirmation"', () => {
    const event = parseCulturalEvent({
      id: 'event-bcn-2',
      name: 'Festival Flamenco Tentativo',
      dateTime: '2026-09-26',
      location: 'Barcelona'
    }, false)

    assert.equal(event.verificationStatus, 'pending_confirmation')
  })
})
