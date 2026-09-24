import test from 'node:test'
import assert from 'node:assert/strict'

import { getMissingProviderKeys, getProviderStatus } from '../services/provider-config.js'

test('provider configuration reports presence and format without exposing secret values', () => {
  const status = getProviderStatus({
    OPENAI_API_KEY: 'sk-test_key',
    MAPBOX_ACCESS_TOKEN: 'pk.test-token',
    GEOAPIFY_API_KEY: '12345678901234567890',
    TOMTOM_API_KEY: ''
  })

  assert.equal(status.openai.configured, true)
  assert.equal(status.openai.formatValid, true)
  assert.equal(status.mapbox.formatValid, true)
  assert.equal(status.geoapify.formatValid, true)
  assert.deepEqual(getMissingProviderKeys({
    OPENAI_API_KEY: '',
    MAPBOX_ACCESS_TOKEN: 'invalid',
    GEOAPIFY_API_KEY: 'short'
  }, ['openai', 'mapbox', 'geoapify']), [
    'OPENAI_API_KEY',
    'MAPBOX_ACCESS_TOKEN',
    'GEOAPIFY_API_KEY'
  ])
})
