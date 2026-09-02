import { GeoCache } from './geoCache.js'

const speechCache = new GeoCache(24 * 60 * 60 * 1000, 300)

// Popular natural ElevenLabs voice IDs
const DEFAULT_ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Bella - natural & warm narrator

/**
 * Synthesizes natural speech using ElevenLabs API
 */
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
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true
      }
    })
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs TTS HTTP ${response.status}: ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Synthesizes natural speech using OpenAI Audio Speech API
 */
async function synthesizeWithOpenAI({
  text,
  voice = 'nova',
  speed = 1.0,
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
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`OpenAI TTS HTTP ${response.status}: ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Unified high-fidelity Speech Synthesis function.
 * Prioritizes ElevenLabs if configured, with automatic fallback to OpenAI TTS.
 */
export async function generateSpeechAudio({
  text = '',
  voice = 'nova',
  speed = 1.0,
  model = 'tts-1',
  provider = 'auto' // 'auto' | 'elevenlabs' | 'openai'
}) {
  const trimmed = (text || '').trim()
  if (!trimmed) {
    throw new Error('El texto para la síntesis de voz no puede estar vacío.')
  }

  const cacheKey = `tts_${provider}_${model}_${voice}_${speed}_${trimmed}`
  const cached = speechCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  // 1. Try ElevenLabs if provider is elevenlabs or auto (and key exists)
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
      console.warn(`[ttsService] ElevenLabs failed (${err.message}). Falling back to OpenAI TTS...`)
      if (provider === 'elevenlabs') throw err
    }
  }

  // 2. OpenAI TTS
  if (openAiKey) {
    const audioBuffer = await synthesizeWithOpenAI({
      text: trimmed,
      voice,
      speed,
      model: model || 'tts-1',
      apiKey: openAiKey
    })
    speechCache.set(cacheKey, audioBuffer)
    return audioBuffer
  }

  throw new Error('No hay proveedores de síntesis de voz (ElevenLabs / OpenAI) configurados en el servidor.')
}
