import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { imageForPlaceWithStatus, isImageSemanticallyCompatible, isWikiTitleRelevant } from '../services/imageSearch.js'

describe('Stop Images Accuracy and Semantic Compatibility Tests', () => {
  it('should never assign colonial churches or facades to beaches like Playa Blanca Coveñas', async () => {
    const result = await imageForPlaceWithStatus('Playa Blanca Coveñas', 'Coveñas', 'beach')
    assert.ok(result && result.url, 'Must return a valid image result')
    const lower = result.url.toLowerCase()
    assert.ok(!lower.includes('frente_parroquia_tolu'), 'Must NOT return Tolú parish church facade')
    assert.ok(!lower.includes('parroquia'), 'Must NOT return parroquia')
    assert.ok(!lower.includes('iglesia'), 'Must NOT return iglesia')
    assert.ok(!lower.includes('catedral'), 'Must NOT return catedral')
    assert.ok(!lower.includes('.pdf'), 'Must NOT return a PDF document')
    const isCompatible = isImageSemanticallyCompatible(result.url, 'Playa Blanca Coveñas', 'beach')
    assert.equal(isCompatible, true, 'Image must be semantically compatible with a beach')
  })

  it('should reject Wikipedia articles with unrelated titles for destination attractions', () => {
    assert.equal(isWikiTitleRelevant('Tolú', 'Playa Blanca Coveñas', 'Coveñas'), false)
    assert.equal(isWikiTitleRelevant('Noel Petro', 'Playa Blanca Coveñas', 'Coveñas'), false)
    assert.equal(isWikiTitleRelevant('Gonzalo Rodríguez Gacha', 'Playa Blanca Coveñas', 'Coveñas'), false)
    assert.equal(isWikiTitleRelevant('Sincelejo', 'Playa Primera Coveñas', 'Coveñas'), false)
    assert.equal(isWikiTitleRelevant('Castillo San Felipe de Barajas', 'Castillo San Felipe'), true)
    assert.equal(isWikiTitleRelevant('Ventana al Mundo (monumento)', 'Ventana al Mundo'), true)
    assert.equal(isWikiTitleRelevant('Ciénaga de la Caimanera', 'Ciénaga de la Caimanera'), true)
  })

  it('should reject semantically conflicting images across categories', () => {
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/parroquia_tolu.jpg', 'Playa Blanca', 'beach'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/catedral_primada.jpg', 'Playa Primera', 'beach'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/fachada_colonial.jpg', 'Playa Tranquila', 'beach'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/iglesia_antigua.jpg', 'Ciénaga de la Caimanera', 'nature'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/catedral_metropolitana.jpg', 'Restaurante El Pescador', 'restaurant'), false)
    assert.equal(isImageSemanticallyCompatible('https://images.unsplash.com/photo-beach.jpg', 'Playa Blanca', 'beach'), true)
    assert.equal(isImageSemanticallyCompatible('https://images.unsplash.com/photo-mangrove.jpg', 'Ciénaga de la Caimanera', 'nature'), true)
  })

  it('should serve genuine nature imagery for wetlands like Ciénaga de la Caimanera', async () => {
    const result = await imageForPlaceWithStatus('Ciénaga de la Caimanera', 'Coveñas', 'nature')
    assert.ok(result && result.url, 'Must return a valid image result')
    const lower = result.url.toLowerCase()
    assert.ok(!lower.includes('iglesia'), 'Must not be a church')
    assert.ok(!lower.includes('parroquia'), 'Must not be a parish')
    assert.ok(!lower.includes('.pdf'), 'Must not be a PDF')
    assert.equal(isImageSemanticallyCompatible(result.url, 'Ciénaga de la Caimanera', 'nature'), true)
  })

  it('should reject person biography Wikipedia articles for cultural venues and monuments', () => {
    assert.equal(isWikiTitleRelevant('Gabriel García Márquez', 'Museo del Caribe Gabriel García Márquez'), false)
    assert.equal(isWikiTitleRelevant('Joe Arroyo', 'Monumento a Joe Arroyo'), false)
    assert.equal(isWikiTitleRelevant('Simón Bolívar', 'Plaza de Bolívar'), false)
    assert.equal(isWikiTitleRelevant('Frida Kahlo', 'Museo Frida Kahlo'), false)
    assert.equal(isWikiTitleRelevant('Francisco de Paula Santander', 'Parque Santander'), false)
    assert.equal(isWikiTitleRelevant('Museo del Caribe (Colombia)', 'Museo del Caribe Gabriel García Márquez'), true)
  })

  it('should reject hospital kitchens, trees and medical images for restaurants', () => {
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/Cocina_hospital_colina.jpg', 'Cocina 33', 'restaurant'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/Palo_de_mango.jpg', 'Palo de Mango', 'restaurant'), false)
    assert.equal(isImageSemanticallyCompatible('https://commons.wikimedia.org/clinica_norte.jpg', 'Restaurante Gourmet', 'restaurant'), false)
    assert.equal(isImageSemanticallyCompatible('https://images.unsplash.com/photo-dining.jpg', 'Cocina 33', 'restaurant'), true)
    assert.equal(isImageSemanticallyCompatible('https://images.unsplash.com/photo-food.jpg', 'Palo de Mango', 'restaurant'), true)
  })
})