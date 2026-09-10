import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isDistinctNameMatch,
  getDistinctSemanticTokens,
  selectBestPoiResult,
  geocodePlace,
  haversineMeters,
  KNOWN_ICONIC_LANDMARKS
} from '../services/osm.js'

test('getDistinctSemanticTokens extracts key identifying words and filters stopwords', () => {
  const tokens1 = getDistinctSemanticTokens('Museo Romántico, Barranquilla, Colombia')
  assert.ok(tokens1.includes('romantico'), 'Must include romantico')
  assert.equal(tokens1.includes('museo'), false, 'Must filter out generic category museo')
  assert.equal(tokens1.includes('barranquilla'), false, 'Must filter out city name')
  assert.equal(tokens1.includes('colombia'), false, 'Must filter out country name')

  const tokens2 = getDistinctSemanticTokens('Restaurante Cucayo')
  assert.ok(tokens2.includes('cucayo'), 'Must include cucayo')
  assert.equal(tokens2.includes('restaurante'), false, 'Must filter out restaurante')

  const tokens3 = getDistinctSemanticTokens('Salgarito Beach Club')
  assert.ok(tokens3.includes('salgarito'), 'Must include salgarito')
})

test('isDistinctNameMatch strictly rejects mismatched POIs sharing only generic category words', () => {
  // Critical bug case: Querying Museo Romántico should NEVER match Museo del Carnaval
  assert.equal(isDistinctNameMatch('Museo Romántico', 'Museo del Carnaval'), false)
  assert.equal(isDistinctNameMatch('Museo Romántico, Barranquilla', 'Museo del Carnaval'), false)
  assert.equal(isDistinctNameMatch('Museo Romántico', 'Museo del Caribe'), false)
  assert.equal(isDistinctNameMatch('Restaurante Cucayo', 'Restaurante Pepe Anca'), false)
  assert.equal(isDistinctNameMatch('Restaurante Narcobollo', 'Tiendas D1'), false)
  assert.equal(isDistinctNameMatch('Salgarito Beach Club', 'Restaurante Bar El Cisne'), false)

  // Valid matches
  assert.equal(isDistinctNameMatch('Museo Romántico', 'Museo Romántico de Barranquilla'), true)
  assert.equal(isDistinctNameMatch('Restaurante Cucayo', 'Cucayo Sabor Costeño'), true)
  assert.equal(isDistinctNameMatch('Zoológico de Barranquilla', 'Fundación Botánica y Zoológica de Barranquilla'), true)
  assert.equal(isDistinctNameMatch('Castillo de Salgar', 'Castillo San Antonio de Salgar'), true)
})

test('selectBestPoiResult rejects unrelated landmarks when semantic tokens differ', () => {
  const wrongMuseum = {
    name: 'Museo del Carnaval',
    type: 'museum',
    latitude: 10.9928,
    longitude: -74.7876
  }
  const correctMuseum = {
    name: 'Museo Romántico',
    type: 'museum',
    latitude: 10.9950,
    longitude: -74.7940
  }
  const picked = selectBestPoiResult([wrongMuseum, correctMuseum], 'Museo Romántico')
  assert.ok(picked)
  assert.equal(picked.name, 'Museo Romántico')
})

test('geocodePlace resolves verified real GPS coordinates for the 10 reported places', async () => {
  const bqLat = 10.9685
  const bqLon = -74.7813
  const isNearby = (p, lat, lon, maxMeters = 1500) => {
    assert.ok(p, 'Place should not be null')
    const dist = haversineMeters(p.latitude, p.longitude, lat, lon)
    assert.ok(dist <= maxMeters, `Expected ${p.name} to be within ${maxMeters}m of ${lat}, ${lon}, got ${dist.toFixed(0)}m`)
  }

  // 1. Cucayo (Cra 49C # 76-80, not Pepe Anca)
  const cucayo = await geocodePlace('Restaurante Cucayo', bqLat, bqLon)
  isNearby(cucayo, 10.99986, -74.80920, 500)

  // 2. Zoológico de Barranquilla (Barrio La Concepción)
  const zoo = await geocodePlace('Zoológico de Barranquilla', bqLat, bqLon)
  isNearby(zoo, 11.0110, -74.7980, 500)

  // 3. Castillo de Salgar (Punta Salgar cliff)
  const salgar = await geocodePlace('Castillo de Salgar', bqLat, bqLon)
  isNearby(salgar, 11.0182, -74.9417, 500)

  // 4. Narcobollo (Cra 43 # 84-188, not Clinica San Vicente)
  const narcobollo = await geocodePlace('Restaurante Narcobollo', bqLat, bqLon)
  isNearby(narcobollo, 10.9982, -74.8202, 500)

  // 5. Plaza de San Nicolás (Calle 32)
  const sanNicolas = await geocodePlace('Plaza de San Nicolás', bqLat, bqLon)
  isNearby(sanNicolas, 10.9798, -74.7774, 500)

  // 6. Varadero Gastrobar (Cra 51B # 79-97)
  const varadero = await geocodePlace('Restaurante Varadero', bqLat, bqLon)
  isNearby(varadero, 11.0028, -74.8166, 500)

  // 7. Museo Romántico (Cra 54 # 59-199, El Prado, not road roadway)
  const museoRomantico = await geocodePlace('Museo Romántico', bqLat, bqLon)
  isNearby(museoRomantico, 10.99465, -74.79385, 300)

  // 8. Iglesia de la Inmaculada Concepción (Cra 57 # 68-85, El Prado, not Jumbo Supermarket)
  const inmaculada = await geocodePlace('Iglesia de la Inmaculada Concepción', bqLat, bqLon)
  isNearby(inmaculada, 10.99881, -74.79818, 500)

  // 9. Plaza de la Paz (Calle 53 en frente de la Catedral María Reina)
  const plazaPaz = await geocodePlace('Plaza de la Paz', bqLat, bqLon)
  isNearby(plazaPaz, 10.98802, -74.78901, 300)

  // 10. Salgarito Beach Club (Salgar ocean coast)
  const salgarito = await geocodePlace('Salgarito Beach Club', bqLat, bqLon)
  isNearby(salgarito, 11.0205, -74.9325, 500)

  // 11. Restaurante La Casa de Doris (Calle 35 # 45-37)
  const doris = await geocodePlace('Restaurante La Casa de Doris', bqLat, bqLon)
  isNearby(doris, 10.9852, -74.7795, 500)
})
