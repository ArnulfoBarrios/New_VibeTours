import test from 'node:test'
import assert from 'node:assert/strict'
import { isGenericDescription } from '../routes/ai.js'
import { generateRichPlaceDescriptionsBatch } from '../services/openai.js'

test('isGenericDescription correctly flags placeholder and cliché text', () => {
  // Empty or too short
  assert.equal(isGenericDescription(''), true)
  assert.equal(isGenericDescription('Lugar turístico'), true)
  assert.equal(isGenericDescription('Monumento a Shakira', 'Monumento a Shakira'), true)

  // Generic fallback clichés
  assert.equal(isGenericDescription('Monumento a Shakira es un hito conmemorativo y visual icónico en Barranquilla, creado para homenajear la identidad, cultura y legado de la comunidad.'), true)
  assert.equal(isGenericDescription('Bocas de Ceniza sorprende por sus espejos de agua serenos y canales rodeados de mangles en Barranquilla, brindando un contacto genuino con la naturaleza nativa.'), true)
  assert.equal(isGenericDescription('Espacio emblemático de enriquecimiento cultural en Barranquilla.'), true)

  // Rich AI Audio-Guide descriptions should NOT be flagged as generic
  const richShakiraDesc = 'Ahora nos encontramos ante un vibrante tributo a una de las artistas colombianas más reconocidas en el mundo: Shakira. Este monumento celebra su trayectoria musical, su ritmo inconfundible y su conexión indeleble con Barranquilla.'
  assert.equal(isGenericDescription(richShakiraDesc, 'Monumento a Shakira'), false)

  const richBocasDesc = 'Prepárate para contemplar uno de los paisajes más imponentes del Caribe colombiano: el punto exacto donde el caudaloso río Magdalena desemboca en el mar abierto, entre el tajamar y la brisa marina.'
  assert.equal(isGenericDescription(richBocasDesc, 'Bocas de Ceniza'), false)
})

test('generateRichPlaceDescriptionsBatch produces rich, contextually accurate content for Shakira and Bocas de Ceniza', async () => {
  const result = await generateRichPlaceDescriptionsBatch({
    destination: 'Barranquilla',
    city: 'Barranquilla',
    country: 'Colombia',
    places: ['Monumento a Shakira', 'Bocas de Ceniza']
  })

  assert.ok(result['Monumento a Shakira'], 'Monumento a Shakira must be present in result')
  assert.ok(result['Bocas de Ceniza'], 'Bocas de Ceniza must be present in result')

  const shakira = result['Monumento a Shakira']
  const bocas = result['Bocas de Ceniza']

  // 1. Shakira checks
  assert.ok(shakira.descripcion && shakira.descripcion.length > 40, 'Shakira description should be substantial')
  assert.ok(Array.isArray(shakira.actividades) && shakira.actividades.length >= 2, 'Shakira activities should exist')
  assert.ok(Array.isArray(shakira.consejos) && shakira.consejos.length >= 1, 'Shakira tips should exist')

  // Shakira tips must NEVER contain solemn funeral/church rules
  const shakiraTipsCombined = shakira.consejos.join(' ').toLowerCase()
  assert.equal(shakiraTipsCombined.includes('silencio'), false, 'Shakira tips must not ask for silence')
  assert.equal(shakiraTipsCombined.includes('vestimenta adecuada'), false, 'Shakira tips must not require formal dress code')
  assert.equal(shakiraTipsCombined.includes('perturbar'), false, 'Shakira tips must not mention disturbing the peace')

  // 2. Bocas de Ceniza checks
  assert.ok(bocas.descripcion && bocas.descripcion.length > 40, 'Bocas de Ceniza description should be substantial')
  const bocasDescLower = bocas.descripcion.toLowerCase()
  assert.equal(bocasDescLower.includes('espejos de agua serenos'), false, 'Bocas de Ceniza must not be described as serene wetland mirrors')
  assert.ok(
    bocasDescLower.includes('tajamar') || bocasDescLower.includes('río') || bocasDescLower.includes('rio') || bocasDescLower.includes('mar') || bocasDescLower.includes('desembocadura'),
    'Bocas de Ceniza description must mention tajamar, river, sea, or river mouth'
  )

  const bocasActivitiesCombined = bocas.actividades.join(' ').toLowerCase()
  assert.ok(
    bocasActivitiesCombined.includes('tajamar') || bocasActivitiesCombined.includes('desembocadura') || bocasActivitiesCombined.includes('río') || bocasActivitiesCombined.includes('mar') || bocasActivitiesCombined.includes('corrientes'),
    'Bocas de Ceniza activities must relate to the breakwater, ocean, or river mouth'
  )
})
