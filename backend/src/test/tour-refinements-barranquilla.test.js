import test from 'node:test'
import assert from 'node:assert/strict'
import { KNOWN_ICONIC_LANDMARKS, isFoodOrDrinkEstablishment } from '../services/osm.js'
import { arePlaceNamesSemanticallySame, getCulinarySpecialtyNarrative } from '../services/open-tourism-service.js'
import { isImageSemanticallyCompatible } from '../services/imageSearch.js'
import { FALLBACK_DESTINATION_CENTROIDS } from '../services/destinationService.js'

test('KNOWN_ICONIC_LANDMARKS should have exact coordinates for Barranquilla iconic sites', () => {
  // Museo del Atlantico must be at Cra 39 #35-21 (Centro Histórico)
  const museoAtlantico = KNOWN_ICONIC_LANDMARKS['museo del atlantico']
  assert.ok(museoAtlantico, 'museo del atlantico must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(museoAtlantico.latitude, 10.97825)
  assert.equal(museoAtlantico.longitude, -74.77990)

  // Shakira monument must be at Gran Malecón Sector 3 (OSM node 11514927669)
  const shakira = KNOWN_ICONIC_LANDMARKS['monumento a shakira']
  assert.ok(shakira, 'monumento a shakira must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(shakira.latitude, 11.00997)
  assert.equal(shakira.longitude, -74.78203)

  // Museo de Antropología (Bellas Artes)
  const museoAntropologia = KNOWN_ICONIC_LANDMARKS['museo de antropologia']
  assert.ok(museoAntropologia, 'museo de antropologia must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(museoAntropologia.latitude, 10.99689)
  assert.equal(museoAntropologia.longitude, -74.79852)

  // Parque Fundadores de la Aviación (El Prado)
  const parqueFundadores = KNOWN_ICONIC_LANDMARKS['parque fundadores de la aviacion']
  assert.ok(parqueFundadores, 'parque fundadores de la aviacion must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(parqueFundadores.latitude, 10.99449)
  assert.equal(parqueFundadores.longitude, -74.79331)

  // Plaza de la Locomotora (Barrio Abajo / Aduana)
  const plazaLocomotora = KNOWN_ICONIC_LANDMARKS['plaza de la locomotora']
  assert.ok(plazaLocomotora, 'plaza de la locomotora must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(plazaLocomotora.latitude, 10.98841)
  assert.equal(plazaLocomotora.longitude, -74.77888)

  // Museo Bibliografico de Autores del Caribe
  const museoBiblio = KNOWN_ICONIC_LANDMARKS['museo bibliografico de autores del caribe']
  assert.ok(museoBiblio, 'museo bibliografico de autores del caribe must exist in KNOWN_ICONIC_LANDMARKS')
  assert.equal(museoBiblio.latitude, 10.9998)
  assert.equal(museoBiblio.longitude, -74.7990)
})

test('arePlaceNamesSemanticallySame should identify church and facing plaza as co-located', () => {
  const isSame = arePlaceNamesSemanticallySame('Iglesia de San Roque', 'Plaza de San Roque', 'Barranquilla')
  assert.equal(isSame, true, 'Iglesia de San Roque and Plaza de San Roque must be recognized as co-located')

  const isSameSanNicolas = arePlaceNamesSemanticallySame('Iglesia San Nicolás de Tolentino', 'Plaza San Nicolás', 'Barranquilla')
  assert.equal(isSameSanNicolas, true, 'Iglesia and Plaza San Nicolás must be recognized as co-located')

  // Unrelated church and plaza must not collide
  const diff = arePlaceNamesSemanticallySame('Iglesia de San Roque', 'Plaza de la Paz', 'Barranquilla')
  assert.equal(diff, false, 'Iglesia de San Roque and Plaza de la Paz are distinct')
})

test('isImageSemanticallyCompatible should reject sports cars and automotive images for cultural POIs', () => {
  const sportsCarUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?sports_car=nissan_gtr'
  const museumName = 'Museo Bibliográfico de Autores del Caribe'
  const isCompatible = isImageSemanticallyCompatible(sportsCarUrl, museumName, 'museum')
  assert.equal(isCompatible, false, 'Sports car photo must be rejected for a bibliographic museum')

  const bookUrl = 'https://images.unsplash.com/photo-1544816155-12df9643f363?library=books'
  assert.equal(isImageSemanticallyCompatible(bookUrl, museumName, 'museum'), true)
})

test('getCulinarySpecialtyNarrative should generate distinct narratives for bakeries, lechoneras and seafood', () => {
  const bakeryDesc = getCulinarySpecialtyNarrative('La casa del pan', 'Barranquilla')
  assert.ok(bakeryDesc.includes('pan artesanal recién horneado') || bakeryDesc.includes('amasijos tradicionales'))

  const lechonaDesc = getCulinarySpecialtyNarrative("Lechona Serrano's", 'Barranquilla')
  assert.ok(lechonaDesc.includes('lechona') || lechonaDesc.includes('crujiente cuero dorado'))

  const generalDesc = getCulinarySpecialtyNarrative('Sabor de mi tierra', 'Barranquilla')
  assert.ok(generalDesc.includes('identidad caribeña') || generalDesc.includes('cocina tradicional casera'))

  // All three must be unique
  assert.notEqual(bakeryDesc, lechonaDesc)
  assert.notEqual(bakeryDesc, generalDesc)
  assert.notEqual(lechonaDesc, generalDesc)
})

test('FALLBACK_DESTINATION_CENTROIDS should use central Plaza de la Paz coordinates for Barranquilla', () => {
  const center = FALLBACK_DESTINATION_CENTROIDS['barranquilla']
  assert.ok(center, 'Center should exist')
  // Centroid must NOT be in the southeastern industrial docks (10.9685, -74.7813)
  assert.equal(center.latitude, 10.9878)
  assert.equal(center.longitude, -74.7889)
})
