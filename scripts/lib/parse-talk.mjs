import { readFile } from 'node:fs/promises'
import matter from 'gray-matter'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const REQUIRED_TOP = ['title']
const REQUIRED_TALK = ['date', 'event', 'description']

function normalizeDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      return { ok: false, reason: `not a valid date: ${value}` }
    const iso = value.toISOString().slice(0, 10)
    return { ok: true, value: iso }
  }
  if (typeof value === 'string') {
    if (!ISO_DATE_RE.test(value))
      return { ok: false, reason: `must be ISO date (YYYY-MM-DD), got: ${value}` }
    if (Number.isNaN(Date.parse(value)))
      return { ok: false, reason: `not a valid date: ${value}` }
    return { ok: true, value }
  }
  return { ok: false, reason: `unsupported type for talk.date: ${typeof value}` }
}

export async function parseTalk(filePath, { folderSlug }) {
  const raw = await readFile(filePath, 'utf8')
  const { data } = matter(raw)
  const errors = []

  for (const key of REQUIRED_TOP) {
    if (!data[key])
      errors.push(`missing required field: ${key}`)
  }

  const talk = data.talk ?? {}
  for (const key of REQUIRED_TALK) {
    if (!talk[key])
      errors.push(`missing required field: talk.${key}`)
  }

  let normalizedDate = null
  if (talk.date) {
    const r = normalizeDate(talk.date)
    if (!r.ok)
      errors.push(`talk.date ${r.reason}`)
    else
      normalizedDate = r.value
  }

  if (errors.length) {
    const msg = errors.map(e => `  - ${e}`).join('\n')
    throw new Error(`Invalid talk frontmatter in ${filePath}:\n${msg}`)
  }

  return {
    slug: talk.slug ?? folderSlug,
    title: data.title,
    date: normalizedDate,
    event: talk.event,
    location: talk.location ?? null,
    description: talk.description,
    tags: Array.isArray(talk.tags) ? talk.tags : [],
    draft: talk.draft === true,
    exportPdf: talk.exportPdf !== false,
  }
}
