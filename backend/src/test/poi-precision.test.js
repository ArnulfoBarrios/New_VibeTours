import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { selectBestPoiResult } from '../services/osm.js'

describe('POI Coordinates Precision Unit Test', () => {
  it('should filter out transit stops and select actual museum node for Frost Museum of Science query', () => {
    const mockResults = [
      {
        name: 'College Bayside Metromover Station',
        latitude: 25.7781,
        longitude: -80.1901,
        type: 'station',
        tags: { osm_key: 'railway', osm_value: 'station' }
      },
      {
        name: 'Phillip and Patricia Frost Museum of Science',
        latitude: 25.7845,
        longitude: -80.1872,
        type: 'museum',
        tags: { osm_key: 'tourism', osm_value: 'museum' }
      }
    ]

    const selected = selectBestPoiResult(mockResults, 'Frost Museum of Science Miami')
    assert.equal(selected.name, 'Phillip and Patricia Frost Museum of Science')
    assert.equal(selected.type, 'museum')
  })

  it('should filter out bus stops and select park node for Bayfront Park query', () => {
    const mockResults = [
      {
        name: 'Biscayne Blvd & NE 5th St Bus Stop',
        latitude: 25.7790,
        longitude: -80.1895,
        type: 'bus_stop',
        tags: { osm_key: 'highway', osm_value: 'bus_stop' }
      },
      {
        name: 'Bayfront Park',
        latitude: 25.7750,
        longitude: -80.1860,
        type: 'park',
        tags: { osm_key: 'leisure', osm_value: 'park' }
      }
    ]

    const selected = selectBestPoiResult(mockResults, 'Bayfront Park Miami')
    assert.equal(selected.name, 'Bayfront Park')
    assert.equal(selected.type, 'park')
  })
})
