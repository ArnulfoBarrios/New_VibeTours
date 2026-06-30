import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, 'backend/.env')
const outputPath = resolve(root, 'assets/config/public_config.json')

const allowedKeys = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'API_BASE_URL',
  'GOOGLE_WEB_CLIENT_ID',
  'GOOGLE_IOS_CLIENT_ID',
  'TOMTOM_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_USER_ID'
]

const env = parseEnv(await readFile(envPath, 'utf8'))
const output = {}

for (const key of allowedKeys) {
  if (env[key]) output[key] = env[key]
}

if (!output.API_BASE_URL) {
  output.API_BASE_URL = 'http://192.168.1.114:3000/api'
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${outputPath} with public client configuration.`)

function parseEnv(raw) {
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '')
        return [key, value]
      })
      .filter(([key]) => key)
  )
}
