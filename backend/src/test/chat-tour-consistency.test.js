import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

const requestSchema = z.object({
  destination: z.string().optional().default(''),
  country: z.string().optional().default(''),
  city: z.string().optional().default(''),
  selectedPlaces: z.array(z.string()).optional().default([]),
  specificPlaces: z.array(z.string()).optional().default([])
})

describe('Chat to Tour Consistency Unit Test', () => {
  it('should parse and preserve specificPlaces and selectedPlaces in backend requestSchema', () => {
    const rawBody = {
      destination: 'Miami, Florida, Estados Unidos',
      city: 'Miami',
      country: 'Estados Unidos',
      specificPlaces: ['La Mar by Gastón Acurio', 'Wynwood', 'Joe\'s Stone Crab'],
      selectedPlaces: ['Versailles']
    }

    const parsed = requestSchema.parse(rawBody)
    assert.deepEqual(parsed.specificPlaces, ['La Mar by Gastón Acurio', 'Wynwood', 'Joe\'s Stone Crab'])
    assert.deepEqual(parsed.selectedPlaces, ['Versailles'])

    const merged = Array.from(new Set([
      ...parsed.specificPlaces,
      ...parsed.selectedPlaces
    ]))

    assert.equal(merged.length, 4)
    assert.ok(merged.includes('La Mar by Gastón Acurio'))
    assert.ok(merged.includes('Wynwood'))
    assert.ok(merged.includes('Joe\'s Stone Crab'))
    assert.ok(merged.includes('Versailles'))
  })
})
