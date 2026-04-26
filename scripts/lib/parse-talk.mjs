import { readFile } from 'node:fs/promises'
import matter from 'gray-matter'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const REQUIRED_TOP = ['title']
const REQUIRED_TALK = ['date', 'event', 'description']

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

  if (talk.date && !ISO_DATE_RE.test(String(talk.date))) {
    errors.push(`talk.date must be ISO date (YYYY-MM-DD), got: ${talk.date}`)
  }
  else if (talk.date && Number.isNaN(Date.parse(talk.date))) {
    errors.push(`talk.date is not a valid date: ${talk.date}`)
  }

  if (errors.length) {
    const msg = errors.map(e => `  - ${e}`).join('\n')
    throw new Error(`Invalid talk frontmatter in ${filePath}:\n${msg}`)
  }

  return {
    slug: talk.slug ?? folderSlug,
    title: data.title,
    date: talk.date,
    event: talk.event,
    location: talk.location ?? null,
    description: talk.description,
    tags: Array.isArray(talk.tags) ? talk.tags : [],
    draft: talk.draft === true,
    exportPdf: talk.exportPdf !== false,
  }
}
