import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseTalk } from './parse-talk.mjs'

const fixDir = fileURLToPath(new URL('./__fixtures__/', import.meta.url))
const fix = name => path.join(fixDir, name)

describe('parseTalk', () => {
  it('parses a valid talk and infers slug from folder name', async () => {
    const result = await parseTalk(fix('valid.md'), { folderSlug: '2026-04-sample' })
    expect(result).toMatchObject({
      slug: '2026-04-sample',
      title: 'Sample Talk',
      date: '2026-04-15',
      event: 'Test Meetup',
      location: 'Taipei',
      description: 'A sample talk used in tests.',
      tags: ['sample', 'test'],
      draft: false,
      exportPdf: true,
    })
  })

  it('accepts a YAML-quoted ISO date string and returns it as-is', async () => {
    const result = await parseTalk(fix('quoted-date.md'), { folderSlug: 'q' })
    expect(result.date).toBe('2026-04-15')
  })

  it('uses talk.slug override when provided', async () => {
    const result = await parseTalk(fix('slug-override.md'), { folderSlug: 'ignored' })
    expect(result.slug).toBe('custom-slug')
  })

  it('marks draft talks via draft flag', async () => {
    const result = await parseTalk(fix('draft.md'), { folderSlug: 'draft' })
    expect(result.draft).toBe(true)
  })

  it('defaults exportPdf to true and tags to []', async () => {
    const result = await parseTalk(fix('slug-override.md'), { folderSlug: 'x' })
    expect(result.exportPdf).toBe(true)
    expect(result.tags).toEqual([])
  })

  it('throws when title is missing', async () => {
    await expect(parseTalk(fix('missing-title.md'), { folderSlug: 'x' }))
      .rejects
      .toThrow(/title/)
  })

  it('throws when talk.date is missing', async () => {
    await expect(parseTalk(fix('missing-talk-date.md'), { folderSlug: 'x' }))
      .rejects
      .toThrow(/talk\.date/)
  })

  it('throws when talk.date is not a valid ISO date', async () => {
    await expect(parseTalk(fix('invalid-date.md'), { folderSlug: 'x' }))
      .rejects
      .toThrow(/date/i)
  })
})
