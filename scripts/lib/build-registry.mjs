function normalizeBase(basePath) {
  if (!basePath || basePath === '/')
    return '/'
  const stripped = basePath.replace(/\/+$/, '')
  return `${stripped}/`
}

export function buildRegistry(parsedTalks, { basePath }) {
  const base = normalizeBase(basePath)
  const seen = new Map()
  for (const t of parsedTalks) {
    if (seen.has(t.slug))
      throw new Error(`duplicate slug "${t.slug}" between ${seen.get(t.slug)} and ${t.title}`)
    seen.set(t.slug, t.title)
  }

  const visible = parsedTalks.filter(t => !t.draft)
  const sorted = [...visible].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return sorted.map(t => ({
    slug: t.slug,
    title: t.title,
    date: t.date,
    event: t.event,
    location: t.location,
    description: t.description,
    tags: t.tags,
    url: `${base}talks/${t.slug}/`,
    pdfUrl: t.exportPdf ? `${base}talks/${t.slug}/slides-export.pdf` : null,
  }))
}
