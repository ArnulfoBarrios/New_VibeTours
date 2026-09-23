import test from 'node:test'
import assert from 'node:assert/strict'
import { isFoodOrDrinkEstablishment, haversineMeters } from '../services/osm.js'
import { getReliableCategoryFallbackImage, buildRecommendationReason } from '../routes/ai.js'
import { isImageSemanticallyCompatible, imageForPlaceWithStatus } from '../services/imageSearch.js'
import { resolvePlaceWithCascade } from '../services/places-resolver.js'

test('isFoodOrDrinkEstablishment detects iconic dining names without generic prefix', () => {
  assert.equal(isFoodOrDrinkEstablishment('Cucayo'), true, 'Cucayo should be identified as food establishment')
  assert.equal(isFoodOrDrinkEstablishment('Restaurante Cucayo'), true)
  assert.equal(isFoodOrDrinkEstablishment('Varadero'), true, 'Varadero should be identified as food establishment')
  assert.equal(isFoodOrDrinkEstablishment('Restaurante Varadero'), true)
  assert.equal(isFoodOrDrinkEstablishment('Narcobollo'), true)
  assert.equal(isFoodOrDrinkEstablishment('Caimán del Río'), true)
})

test('buildRecommendationReason generates culinary description for Cucayo and Varadero, never beach/coastal', () => {
  const reasonCucayo = buildRecommendationReason(
    { name: 'Cucayo', category: 'requested' },
    { city: 'Barranquilla' }
  )
  assert.ok(
    reasonCucayo.includes('referente culinario') || reasonCucayo.includes('gastronomía'),
    `Expected culinary description for Cucayo, got: "${reasonCucayo}"`
  )
  assert.ok(
    !reasonCucayo.includes('aguas cristalinas') && !reasonCucayo.includes('paisajes costeros'),
    'Cucayo must NOT receive coastal/beach description'
  )

  const reasonVaradero = buildRecommendationReason(
    { name: 'Varadero', category: 'restaurant' },
    { city: 'Barranquilla' }
  )
  assert.ok(
    reasonVaradero.includes('referente culinario') || reasonVaradero.includes('gastronomía'),
    `Expected culinary description for Varadero, got: "${reasonVaradero}"`
  )
  assert.ok(
    !reasonVaradero.includes('aguas cristalinas') && !reasonVaradero.includes('paisajes costeros'),
    'Varadero must NOT receive coastal/beach description'
  )
})

test('getReliableCategoryFallbackImage assigns gastronomy pool to Cucayo and Varadero', () => {
  const fallbackCucayo = getReliableCategoryFallbackImage('Cucayo', 'requested')
  const fallbackVaradero = getReliableCategoryFallbackImage('Varadero', 'requested')

  assert.ok(
    fallbackCucayo.includes('photo-1590846406792') ||
    fallbackCucayo.includes('photo-1555396273') ||
    fallbackCucayo.includes('photo-1504674900247') ||
    fallbackCucayo.includes('photo-1544025162'),
    `Cucayo fallback image must be from gastronomy pool, got: ${fallbackCucayo}`
  )

  assert.ok(
    fallbackVaradero.includes('photo-1590846406792') ||
    fallbackVaradero.includes('photo-1555396273') ||
    fallbackVaradero.includes('photo-1504674900247') ||
    fallbackVaradero.includes('photo-1544025162'),
    `Varadero fallback image must be from gastronomy pool, got: ${fallbackVaradero}`
  )
})

test('imageSearch rejects beach photos for Varadero and Cucayo dining establishments', () => {
  const isCucayoCompatibleWithBeach = isImageSemanticallyCompatible(
    'https://upload.wikimedia.org/wikipedia/commons/playa_barranquilla.jpg',
    'Cucayo',
    'restaurant'
  )
  assert.equal(isCucayoCompatibleWithBeach, false, 'Food establishment must reject beach image')

  const isVaraderoCompatibleWithBeach = isImageSemanticallyCompatible(
    'https://upload.wikimedia.org/wikipedia/commons/playa_cuba_varadero.jpg',
    'Varadero',
    'restaurant'
  )
  assert.equal(isVaraderoCompatibleWithBeach, false, 'Varadero restaurant must reject beach image')
})

test('imageForPlaceWithStatus returns verified authentic images for Cucayo and Varadero', async () => {
  const varaderoImg = await imageForPlaceWithStatus('Varadero', 'Barranquilla', 'restaurant', 0)
  assert.ok(varaderoImg.url, 'Must return image URL')
  assert.equal(varaderoImg.isFallback, false, 'Must match verified known landmark image')
  assert.ok(!varaderoImg.url.includes('cuba') && !varaderoImg.url.includes('beach'), 'Must not link to Cuban beach')

  const cucayoImg = await imageForPlaceWithStatus('Cucayo', 'Barranquilla', 'restaurant', 0)
  assert.ok(cucayoImg.url, 'Must return image URL')
  assert.equal(cucayoImg.isFallback, false, 'Must match verified known landmark image')
  assert.ok(cucayoImg.url.includes('photo-1590846406792'), 'Must match authentic colorful patio dining image')
})

test('Cucayo resolves precisely to Calle 85 # 52-153 (11.0074, -74.8174) and never to Calle 91', async () => {
  const result = await resolvePlaceWithCascade({
    name: 'Cucayo',
    city: 'Barranquilla',
    country: 'Colombia'
  })

  assert.ok(result, 'Cucayo must resolve')
  const distFromCalle85 = haversineMeters(result.latitude, result.longitude, 11.0074, -74.8174)
  assert.ok(distFromCalle85 < 50, `Cucayo must be within 50m of Calle 85 # 52-153, got ${distFromCalle85}m`)

  const distFromCalle91 = haversineMeters(result.latitude, result.longitude, 11.0118, -74.8213)
  assert.ok(distFromCalle91 > 500, `Cucayo must NOT be placed on Calle 91, dist is ${distFromCalle91}m`)
})
