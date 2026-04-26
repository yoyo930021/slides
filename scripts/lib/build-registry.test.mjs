import { describe, expect, it } from 'vitest'
import { buildRegistry } from './build-registry.mjs'

function sample(over = {}) {
  return {
    slug: 'a',
    title: 'A',
    date: '2026-01-01',
    event: 'E',
    location: null,
    description: 'd',
    tags: [],
    draft: false,
    exportPdf: true,
    ...over,
  }
}

describe('buildRegistry', () => {
  it('filters drafts out', () => {
    const out = buildRegistry([sample({ slug: 'a' }), sample({ slug: 'b', draft: true })], { basePath: '/' })
    expect(out.map(t => t.slug)).toEqual(['a'])
  })

  it('sorts by date descending', () => {
    const out = buildRegistry([
      sample({ slug: 'old', date: '2025-01-01' }),
      sample({ slug: 'new', date: '2026-06-01' }),
      sample({ slug: 'mid', date: '2026-01-01' }),
    ], { basePath: '/' })
    expect(out.map(t => t.slug)).toEqual(['new', 'mid', 'old'])
  })

  it('throws on duplicate slugs', () => {
    expect(() =>
      buildRegistry([sample({ slug: 'dup' }), sample({ slug: 'dup' })], { basePath: '/' }),
    ).toThrow(/duplicate slug.*dup/i)
  })

  it('builds url with base path', () => {
    const out = buildRegistry([sample({ slug: 'foo' })], { basePath: '/slides/' })
    expect(out[0].url).toBe('/slides/talks/foo/')
    expect(out[0].pdfUrl).toBe('/slides/talks/foo/slides-export.pdf')
  })

  it('sets pdfUrl to null when exportPdf is false', () => {
    const out = buildRegistry([sample({ slug: 'foo', exportPdf: false })], { basePath: '/' })
    expect(out[0].pdfUrl).toBeNull()
  })

  it('normalizes basePath without trailing slash', () => {
    const out = buildRegistry([sample({ slug: 'foo' })], { basePath: '/slides' })
    expect(out[0].url).toBe('/slides/talks/foo/')
  })
})
