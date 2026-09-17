import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isLodgingCategoryOrGeneric, isLodgingExplicitlyConfirmed } from '../services/openai.js'

test('isLodgingCategoryOrGeneric detects generic lodging types and expressions', () => {
  assert.equal(isLodgingCategoryOrGeneric('Una villa privada está bien'), true)
  assert.equal(isLodgingCategoryOrGeneric('villa privada'), true)
  assert.equal(isLodgingCategoryOrGeneric('un resort de lujo'), true)
  assert.equal(isLodgingCategoryOrGeneric('hotel'), true)
  assert.equal(isLodgingCategoryOrGeneric('cabaña'), true)
  assert.equal(isLodgingCategoryOrGeneric('hotel boutique'), true)
  assert.equal(isLodgingCategoryOrGeneric('por definir'), true)
  assert.equal(isLodgingCategoryOrGeneric('pendiente'), true)

  // Real specific commercial hotels should NOT be considered generic categories
  assert.equal(isLodgingCategoryOrGeneric('Hotel Casa La Fe'), false)
  assert.equal(isLodgingCategoryOrGeneric('Decameron Galeón'), false)
  assert.equal(isLodgingCategoryOrGeneric('Hotel Dann Carlton'), false)
  assert.equal(isLodgingCategoryOrGeneric('Zuana Beach Resort'), false)
})

test('isLodgingExplicitlyConfirmed rejects unconfirmed or category-only lodging', () => {
  // Category-only / vague inputs
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Villa privada' }, 'Hotel elegido'), false)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Resort' }, 'Por definir'), false)
  assert.equal(isLodgingExplicitlyConfirmed('Una villa privada está bien', 'Por definir'), false)
  assert.equal(isLodgingExplicitlyConfirmed(null, null), false)
  assert.equal(isLodgingExplicitlyConfirmed(null, 'Por definir'), false)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Casa La Fe' }, 'Por definir'), false)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Casa La Fe' }, 'En consulta'), false)
})

test('isLodgingExplicitlyConfirmed accepts home / local lodging', () => {
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Casa propia / Alojamiento particular' }, 'Casa propia / familiar'), true)
  assert.equal(isLodgingExplicitlyConfirmed(null, 'Casa propia / familiar'), true)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'En mi casa' }, null), true)
  assert.equal(isLodgingExplicitlyConfirmed('Casa de un familiar', null), true)
})

test('isLodgingExplicitlyConfirmed accepts specific confirmed hotels', () => {
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Casa La Fe' }, 'Hotel elegido'), true)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Casa La Fe' }, 'CONFIRMADO'), true)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Dann Carlton' }, 'Hotel elegido'), true)
  assert.equal(isLodgingExplicitlyConfirmed({ name: 'Zuana Beach Resort' }, 'Hotel elegido'), true)
})
