/**
 * Fetches official theory questions from data.gov.il and writes public/data/questions.json
 * Run: npm run import
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RESOURCE_ID = '8c0f314f-583d-48b6-9f5f-4483d95f6848'
const API = 'https://data.gov.il/api/3/action/datastore_search'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data/questions.json')

function normalizeLicense(raw) {
  if (raw === 'В') return 'B'
  return raw
}

function extractTags(html) {
  return [...html.matchAll(/«([^»]+)»/g)].map((m) => normalizeLicense(m[1]))
}

function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseAnswers(html) {
  const answers = []
  let correctIndex = 0
  const liRegex = /<li><span(?:\s+id="correctAnswer\d+")?>([\s\S]*?)<\/span><\/li>/gi
  let match
  let i = 0
  while ((match = liRegex.exec(html)) !== null) {
    const chunk = match[0]
    if (/id="correctAnswer\d+"/.test(chunk)) correctIndex = i
    answers.push(stripHtml(match[1]))
    i++
  }
  return { answers, correctIndex }
}

function parseImage(html) {
  const m = html.match(/<img[^>]+src="([^"]+)"/i)
  return m?.[1] ?? null
}

function isForLicenseB(tags) {
  return tags.includes('B')
}

function parseRecord(rec) {
  const html = rec.description4 ?? ''
  const tags = extractTags(html)
  if (!isForLicenseB(tags)) return null

  const titleMatch = rec.title2?.match(/^(\d+)\.\s*([\s\S]+)$/)
  const id = titleMatch?.[1] ?? String(rec._id)
  const text = stripHtml(titleMatch?.[2] ?? rec.title2 ?? '')

  const { answers, correctIndex } = parseAnswers(html)
  if (answers.length < 2) return null

  return {
    id,
    text,
    answers,
    correctIndex,
    category: rec.category?.trim() || 'כללי',
    imageUrl: parseImage(html),
    licenses: tags,
  }
}

async function fetchAll() {
  const all = []
  let offset = 0
  const limit = 500

  while (true) {
    const url = `${API}?resource_id=${RESOURCE_ID}&limit=${limit}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.error?.message ?? 'API error')

    const records = json.result.records ?? []
    all.push(...records)
    process.stdout.write(`\rFetched ${all.length} / ${json.result.total ?? '?'}...`)

    if (records.length < limit) break
    offset += limit
  }
  console.log()
  return all
}

async function main() {
  console.log('Downloading official theory question bank...')
  const records = await fetchAll()
  const questions = records.map(parseRecord).filter(Boolean)

  const byCategory = {}
  for (const q of questions) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1
  }

  const payload = {
    meta: {
      license: 'B',
      language: 'he',
      importedAt: new Date().toISOString(),
      source: 'data.gov.il (package tqhe)',
      total: questions.length,
    },
    questions,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2))

  console.log(`Wrote ${questions.length} questions → ${OUT}`)
  console.log('Categories:', byCategory)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
