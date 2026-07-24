export class GeoCache {
  constructor(ttlMs = 3600000, maxEntries = 500) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
    this.cache = new Map()
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set(key, data) {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs
    })
  }

  clear() {
    this.cache.clear()
  }
}
