import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isDistinctNameMatch,
  getDistinctSemanticTokens,
  selectBestPoiResult,
  geocodePlace,
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
  assert.equal(isDistinctNameMatch('Museo Romántico', 'Museo Romántico de Barranquilla'), true)

  // Critical bug case: Cucayo must never match Pepe Anca
  assert.equal(isDistinctNameMatch('Restaurante Cucayo', 'Pepe Anca Steakhouse'), false)
  assert.equal(isDistinctNameMatch('Cucayo', 'Restaurante Cucayo'), true)

  // Critical bug case: Inmaculada Concepción must never match Country Plaza
  assert.equal(isDistinctNameMatch('Iglesia de la Inmaculada Concepción', 'Centro Comercial Country Plaza'), false)
  assert.equal(isDistinctNameMatch('Iglesia de la Inmaculada Concepción', 'Parroquia Inmaculada Concepción'), true)

  // Critical bug case: Salgarito Beach Club must never match Lago del Cisne or unrelated Salgar road
  assert.equal(isDistinctNameMatch('Salgarito Beach Club', 'Lago del Cisne'), false)
  assert.equal(isDistinctNameMatch('Salgarito Beach Club', 'Salgarito Beach Club'), true)

  // Critical bug case: Narcobollo must never match D1
  assert.equal(isDistinctNameMatch('Restaurante Narcobollo', 'Tiendas D1 Metrópolis Center'), false)
  assert.equal(isDistinctNameMatch('Narcobollo', 'Restaurante Narcobollo'), true)
})

test('selectBestPoiResult rejects unrelated candidate even if category matches', () => {
  const wrongMuseum = {
    name: 'Museo del Carnaval',
    type: 'museum',
    class: 'tourism',
    latitude: 10.9928,
    longitude: -74.7876
  }

  // When only an unrelated museum is returned by geocoder, must return null (do NOT pin wrong place)
  const rejected = selectBestPoiResult([wrongMuseum], 'Museo Romántico')
  assert.equal(rejected, null, 'Must reject Museo del Carnaval when searching Museo Romántico')

  // When the correct museum is present, it must be selected
  const correctMuseum = {
    name: 'Museo Romántico',
    type: 'museum',
    class: 'tourism',
    latitude: 10.9950,
    longitude: -74.7940
  }
  const picked = selectBestPoiResult([wrongMuseum, correctMuseum], 'Museo Romántico')
  assert.ok(picked)
  assert.equal(picked.name, 'Museo Romántico')
})

test('KNOWN_ICONIC_LANDMARKS contains verified real GPS coordinates for the 10 reported places', async () => {
  // 1. Cucayo (Cra 49C # 76-08, not Pepe Anca at 11.0000, -74.8101)
  const cucayo = await geocodePlace('Restaurante Cucayo')
  assert.ok(cucayo)
  assert.equal(cucayo.latitude, 10.9972)
  assert.equal(cucayo.longitude, -74.8095)

  // 2. Zoológico de Barranquilla (Barrio La Concepción, not Villa Country 11.0048, -74.8055)
  const zoo = await geocodePlace('Zoológico de Barranquilla')
  assert.ok(zoo)
  assert.equal(zoo.latitude, 11.0097)
  assert.equal(zoo.longitude, -74.7963)

  // 3. Castillo de Salgar (Punta Salgar cliff, not inland road 11.0253, -74.9189)
  const salgar = await geocodePlace('Castillo de Salgar')
  assert.ok(salgar)
  assert.equal(salgar.latitude, 11.0225)
  assert.equal(salgar.longitude, -74.9317)

  // 4. Narcobollo (Cra 43 # 84-188, not D1 at 10.9980, -74.8198)
  const narcobollo = await geocodePlace('Restaurante Narcobollo')
  assert.ok(narcobollo)
  assert.equal(narcobollo.latitude, 11.0053)
  assert.equal(narcobollo.longitude, -74.8213)

  // 5. Plaza de San Nicolás (Calle 32, not shopping center 10.9820, -74.7770)
  const sanNicolas = await geocodePlace('Plaza de San Nicolás')
  assert.ok(sanNicolas)
  assert.equal(sanNicolas.latitude, 10.9793)
  assert.equal(sanNicolas.longitude, -74.7744)

  // 6. Varadero Gastrobar (Cra 51B # 79-97, not behind NH Hotel 11.0045, -74.8125)
  const varadero = await geocodePlace('Restaurante Varadero')
  assert.ok(varadero)
  assert.equal(varadero.latitude, 11.0028)
  assert.equal(varadero.longitude, -74.8166)

  // 7. Museo Romántico (Cra 54 # 59-199, El Prado, not Museo del Carnaval)
  const museoRomantico = await geocodePlace('Museo Romántico')
  assert.ok(museoRomantico)
  assert.equal(museoRomantico.latitude, 10.9950)
  assert.equal(museoRomantico.longitude, -74.7940)

  // 8. Iglesia de la Inmaculada Concepción (Cra 57 # 75, Parque Santander, not Country Plaza)
  const inmaculada = await geocodePlace('Iglesia de la Inmaculada Concepción')
  assert.ok(inmaculada)
  assert.equal(inmaculada.latitude, 11.0039)
  assert.equal(inmaculada.longitude, -74.8033)

  // 9. Salgarito Beach Club (Salgar ocean coast, not Lago del Cisne)
  const salgarito = await geocodePlace('Salgarito Beach Club')
  assert.ok(salgarito)
  assert.equal(salgarito.latitude, 11.0205)
  assert.equal(salgarito.longitude, -74.9325)

  // 10. Restaurante La Casa de Doris (Calle 35 # 45-37)
  const doris = await geocodePlace('Restaurante La Casa de Doris')
  assert.ok(doris)
  assert.equal(doris.latitude, 10.9852)
  assert.equal(doris.longitude, -74.7795)
})
