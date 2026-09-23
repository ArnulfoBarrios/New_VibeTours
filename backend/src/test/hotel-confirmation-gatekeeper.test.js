import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isLodgingCategoryOrGeneric,
  isLodgingExplicitlyConfirmed,
  isExplicitlyChoosingHotel,
  extractChatInformationFallback,
  formatHotelPriceRange,
  getHotelPriceDisplay
} from '../services/openai.js'

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

test('isExplicitlyChoosingHotel detects affirmative hotel selection and ordinals', () => {
  assert.equal(isExplicitlyChoosingHotel('Ok el Hotel Boutique Don Pepe está bien'), true)
  assert.equal(isExplicitlyChoosingHotel('Ya elegi el hotel Boutique Don Pepe'), true)
  assert.equal(isExplicitlyChoosingHotel('Ya elegí el hotel Boutique Don Pepe'), true)
  assert.equal(isExplicitlyChoosingHotel('Me quedo con el Hotel Boutique Don Pepe'), true)
  assert.equal(isExplicitlyChoosingHotel('Me hospedo en el Hotel Dann Carlton'), true)
  assert.equal(isExplicitlyChoosingHotel('El primero'), true)
  assert.equal(isExplicitlyChoosingHotel('La primera opción'), true)
  assert.equal(isExplicitlyChoosingHotel('Opción 1'), true)
  assert.equal(isExplicitlyChoosingHotel('El segundo'), true)
  assert.equal(isExplicitlyChoosingHotel('Opción 2'), true)
  assert.equal(isExplicitlyChoosingHotel('Recomiéndame hoteles'), false)
})

test('extractChatInformationFallback extracts clean hotel names without suffixes', () => {
  const ext1 = extractChatInformationFallback('Ok el Hotel Boutique Don Pepe está bien')
  assert.equal(ext1.selectedHotel, 'Hotel Boutique Don Pepe')
  assert.equal(ext1.accommodationStatus, 'Hotel elegido')

  const ext2 = extractChatInformationFallback('Ya elegi el hotel Boutique Don Pepe')
  assert.equal(ext2.selectedHotel, 'Hotel Boutique Don Pepe')
  assert.equal(ext2.accommodationStatus, 'Hotel elegido')

  const ext3 = extractChatInformationFallback('Me quedo en el Hotel Casa La Fe por favor')
  assert.equal(ext3.selectedHotel, 'Hotel Casa La Fe')
  assert.equal(ext3.accommodationStatus, 'Hotel elegido')
})

test('formatHotelPriceRange and getHotelPriceDisplay honor user currency', () => {
  // COP currency formatting
  const copRange = formatHotelPriceRange(100, 160, 'cop')
  assert.match(copRange, /COP\/noche/)
  assert.match(copRange, /\$410\.000/)
  assert.match(copRange, /\$660\.000/)

  // USD currency formatting
  const usdRange = formatHotelPriceRange(100, 160, 'usd')
  assert.equal(usdRange, '~$100 - $160 USD/noche')

  // EUR currency formatting
  const eurRange = formatHotelPriceRange(100, 160, 'eur')
  assert.equal(eurRange, '~€93 - €149/noche')

  // getHotelPriceDisplay with hotel object
  const hotel = { name: 'Hotel Boutique Don Pepe', minUsd: 100, maxUsd: 160 }
  assert.match(getHotelPriceDisplay(hotel, 'cop'), /COP\/noche/)
  assert.equal(getHotelPriceDisplay(hotel, 'usd'), '~$100 - $160 USD/noche')
})
