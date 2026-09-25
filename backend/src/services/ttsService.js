import crypto from 'crypto'
import WebSocket from 'ws'
import { GeoCache } from './geoCache.js'

const speechCache = new GeoCache(24 * 60 * 60 * 1000, 300)

const DEFAULT_ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'
const EDGE_TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const EDGE_CHROMIUM_VERSION = '132.0.2957.140'
const WIN_EPOCH_OFFSET_SECONDS = 11644473600

let openAiTtsCircuitOpenUntil = 0

export function isOpenAiTtsCircuitOpen() {
  if (!openAiTtsCircuitOpenUntil) return false
  if (Date.now() >= openAiTtsCircuitOpenUntil) {
    openAiTtsCircuitOpenUntil = 0
    return false
  }
  return true
}

export function resetOpenAiTtsCircuitBreaker() {
  openAiTtsCircuitOpenUntil = 0
}

function detectLanguageLocale(text = '', voice = '') {
  const lowerVoice = String(voice || '').toLowerCase()
  if (lowerVoice.startsWith('en-')) return 'en-US'
  if (lowerVoice.startsWith('es-')) return lowerVoice
  const englishWords = (String(text).match(/\b(the|and|welcome|stop|walk|discover|built|history)\b/gi) || []).length
  return englishWords >= 3 ? 'en-US' : 'es-CO'
}

function selectEdgeNeuralVoice(text = '', requestedVoice = '') {
  const locale = detectLanguageLocale(text, requestedVoice)
  if (locale.startsWith('en')) return 'en-US-AriaNeural'
  if (String(requestedVoice).toLowerCase() === 'onyx' || String(requestedVoice).toLowerCase() === 'echo') {
    return 'es-CO-GonzaloNeural'
  }
  return process.env.EDGE_TTS_VOICE || 'es-CO-SalomeNeural'
}

let cachedClockOffsetMs = null

async function getSyncedEpochSeconds() {
  if (cachedClockOffsetMs === null) {
    try {
      const res = await fetch('https://www.bing.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(2500)
      })
      const dateHeader = res.headers.get('date')
      if (dateHeader) {
        const serverMs = Date.parse(dateHeader)
        if (Number.isFinite(serverMs)) {
          cachedClockOffsetMs = serverMs - Date.now()
        }
      }
    } catch {
      cachedClockOffsetMs = 0
    }
  }
  const nowMs = Date.now() + (cachedClockOffsetMs || 0)
  return Math.floor(nowMs / 1000)
}

async function generateSecMsGecToken() {
  let ticks = (await getSyncedEpochSeconds()) + WIN_EPOCH_OFFSET_SECONDS
  ticks -= ticks % 300
  const fileTimeTicks = BigInt(ticks) * 10000000n
  const strToHash = `${fileTimeTicks.toString()}${EDGE_TRUSTED_CLIENT_TOKEN}`
  return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase()
}

function escapeSsmlText(text = '') {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildEdgeSsml({ text, voiceName, speed = 1.06 }) {
  const ratePct = Math.round(((Number(speed) || 1.06) - 1.0) * 100)
  const rateStr = `${ratePct >= 0 ? '+' : ''}${ratePct}%`
  const lang = voiceName.split('-').slice(0, 2).join('-') || 'es-CO'
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voiceName}'><prosody pitch='+2Hz' rate='${rateStr}' volume='+0%'>${escapeSsmlText(text)}</prosody></voice></speak>`
}

export async function synthesizeWithEdgeNeuralTts({ text, voice = 'nova', speed = 1.06 }) {
  const voiceName = selectEdgeNeuralVoice(text, voice)
  const secMsGec = await generateSecMsGecToken()
  const connectionId = crypto.randomUUID().replace(/-/g, '')
  const muid = crypto.randomBytes(16).toString('hex').toUpperCase()
  const wsUrl =
    `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1` +
    `?Ocp-Apim-Subscription-Key=${EDGE_TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${secMsGec}` +
    `&Sec-MS-GEC-Version=1-${EDGE_CHROMIUM_VERSION}` +
    `&ConnectionId=${connectionId}`

  return new Promise((resolve, reject) => {
    const audioChunks = []
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        try { ws.close() } catch {}
        reject(new Error('Edge Neural TTS timed out'))
      }
    }, 8500)

    const ws = new WebSocket(wsUrl, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Cookie': `MUID=${muid};`,
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${EDGE_CHROMIUM_VERSION} Safari/537.36 Edg/${EDGE_CHROMIUM_VERSION}`
      }
    })

    ws.on('open', () => {
      const configMsg =
        `X-Timestamp:${new Date().toISOString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        })
      ws.send(configMsg)

      const requestId = crypto.randomUUID().replace(/-/g, '')
      const ssml = buildEdgeSsml({ text, voiceName, speed })
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toISOString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml
      ws.send(ssmlMsg)
    })

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const buffer = Buffer.from(data)
        if (buffer.length >= 2) {
          const headerLen = buffer.readUInt16BE(0)
          const headerText = buffer.subarray(2, 2 + headerLen).toString('utf8')
          if (headerText.includes('Path:audio')) {
            audioChunks.push(buffer.subarray(2 + headerLen))
          }
        }
      } else {
        const messageText = data.toString('utf8')
        if (messageText.includes('Path:turn.end')) {
          clearTimeout(timer)
          settled = true
          try { ws.close() } catch {}
          const finalBuffer = Buffer.concat(audioChunks)
          if (finalBuffer.length > 0) {
            resolve(finalBuffer)
          } else {
            reject(new Error('Edge Neural TTS returned empty audio buffer'))
          }
        }
      }
    })

    ws.on('error', (err) => {
      if (!settled) {
        clearTimeout(timer)
        settled = true
        reject(err)
      }
    })

    ws.on('close', () => {
      if (!settled) {
        clearTimeout(timer)
        settled = true
        const finalBuffer = Buffer.concat(audioChunks)
        if (finalBuffer.length > 0) resolve(finalBuffer)
        else reject(new Error('Edge Neural TTS socket closed before completion'))
      }
    })
  })
}

function splitTextForHttpTts(text = '', maxChunkChars = 185) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ')
  const chunks = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChunkChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) chunks.push(current)
      current = word
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export async function synthesizeWithGoogleStreamTts({ text, voice = '' }) {
  const locale = detectLanguageLocale(text, voice).startsWith('en') ? 'en' : 'es-US'
  const chunks = splitTextForHttpTts(text, 185)
  const buffers = []

  for (const chunk of chunks) {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(locale)}&q=${encodeURIComponent(chunk)}`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) {
      throw new Error(`Google Stream TTS HTTP ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    buffers.push(Buffer.from(arrayBuffer))
  }

  return Buffer.concat(buffers)
}

async function synthesizeWithElevenLabs({
  text,
  voiceId = DEFAULT_ELEVENLABS_VOICE_ID,
  apiKey,
  model = 'eleven_multilingual_v2'
}) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.38,
        similarity_boost: 0.80,
        style: 0.40,
        use_speaker_boost: true
      }
    }),
    signal: AbortSignal.timeout(6000)
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs TTS HTTP ${response.status}: ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function synthesizeWithOpenAI({
  text,
  voice = 'nova',
  speed = 1.06,
  model = 'tts-1',
  apiKey
}) {
  const safeVoice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice.toLowerCase())
    ? voice.toLowerCase()
    : 'nova'
  const safeModel = ['tts-1', 'tts-1-hd'].includes(model.toLowerCase())
    ? model.toLowerCase()
    : 'tts-1'
  const safeSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.25), 4.0)

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: safeModel,
      input: text,
      voice: safeVoice,
      speed: safeSpeed,
      response_format: 'mp3'
    }),
    signal: AbortSignal.timeout(6000)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    if (response.status === 401 || response.status === 402 || response.status === 429) {
      openAiTtsCircuitOpenUntil = Date.now() + 30 * 60 * 1000
      console.warn('[ttsService] OpenAI TTS quota/auth failure detected. Circuit breaker active for 30m.')
    }
    throw new Error(`OpenAI TTS HTTP ${response.status}: ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generateSpeechAudio({
  text = '',
  voice = 'nova',
  speed = 1.06,
  model = 'tts-1',
  provider = 'auto'
}) {
  const trimmed = (text || '').trim()
  if (!trimmed) {
    throw new Error('Speech synthesis text cannot be empty.')
  }

  const cacheKey = `tts_${provider}_${model}_${voice}_${speed}_${trimmed}`
  const cached = speechCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  // 1. Try ElevenLabs if configured
  if ((provider === 'elevenlabs' || provider === 'auto') && elevenLabsKey) {
    try {
      const elevenVoiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID
      const audioBuffer = await synthesizeWithElevenLabs({
        text: trimmed,
        voiceId: elevenVoiceId,
        apiKey: elevenLabsKey,
        model: 'eleven_multilingual_v2'
      })
      speechCache.set(cacheKey, audioBuffer)
      return audioBuffer
    } catch (err) {
      console.warn(`[ttsService] ElevenLabs failed (${err.message}). Falling back...`)
      if (provider === 'elevenlabs') throw err
    }
  }

  // 2. Try OpenAI TTS if configured and Circuit Breaker is closed
  if ((provider === 'openai' || provider === 'auto') && openAiKey && !isOpenAiTtsCircuitOpen()) {
    try {
      const audioBuffer = await synthesizeWithOpenAI({
        text: trimmed,
        voice,
        speed,
        model: model || 'tts-1',
        apiKey: openAiKey
      })
      speechCache.set(cacheKey, audioBuffer)
      return audioBuffer
    } catch (err) {
      console.warn(`[ttsService] OpenAI TTS unavailable (${err.message}). Switching to Free Neural TTS...`)
      if (provider === 'openai') throw err
    }
  }

  // 3. Free Neural TTS Level 1: Microsoft Edge Neural Voice (es-CO-SalomeNeural / en-US-AriaNeural)
  try {
    const edgeBuffer = await synthesizeWithEdgeNeuralTts({ text: trimmed, voice, speed })
    speechCache.set(cacheKey, edgeBuffer)
    return edgeBuffer
  } catch (edgeErr) {
    console.warn(`[ttsService] Edge Neural TTS fallback note (${edgeErr.message}). Using HTTP MP3 stream fallback...`)
  }

  // 4. Free Neural TTS Level 2: Google Stream MP3 Fallback
  const googleBuffer = await synthesizeWithGoogleStreamTts({ text: trimmed, voice })
  speechCache.set(cacheKey, googleBuffer)
  return googleBuffer
}
