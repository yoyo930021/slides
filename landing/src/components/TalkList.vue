<script setup lang="ts">
import talks from '@/data/talks.generated.json'

interface Talk {
  slug: string
  title: string
  date: string
  event: string
  location: string | null
  description: string
  tags: string[]
  url: string
  pdfUrl: string | null
}

const list = talks as Talk[]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <section id="talks" class="px-6 py-16">
    <div class="mx-auto max-w-3xl">
      <h2 class="text-2xl font-bold md:text-3xl">
        演講
      </h2>
      <p v-if="list.length === 0" class="mt-6 text-[var(--muted)]">
        尚無演講資料。
      </p>
      <ul v-else class="mt-8 grid gap-4">
        <li
          v-for="t in list"
          :key="t.slug"
          class="group rounded-lg bg-[var(--card)] p-5 transition hover:translate-y-[-2px]"
        >
          <div class="flex items-start justify-between gap-4">
            <a :href="t.url" class="block flex-1">
              <h3 class="text-lg font-semibold group-hover:text-[var(--accent)]">
                {{ t.title }}
              </h3>
              <p class="mt-1 text-sm text-[var(--muted)]">
                {{ formatDate(t.date) }} · {{ t.event }}<span v-if="t.location"> · {{ t.location }}</span>
              </p>
              <p class="mt-3 text-sm">
                {{ t.description }}
              </p>
              <div v-if="t.tags.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="tag in t.tags"
                  :key="tag"
                  class="rounded bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--muted)]"
                >#{{ tag }}</span>
              </div>
            </a>
            <a
              v-if="t.pdfUrl"
              :href="t.pdfUrl"
              class="shrink-0 rounded border border-[var(--muted)] px-3 py-1 text-xs hover:border-[var(--fg)]"
            >PDF</a>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
