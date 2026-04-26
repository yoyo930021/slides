<script setup lang="ts">
import { profile } from '@/data/profile'
</script>

<template>
  <section class="px-6 py-20 md:py-28">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-5xl font-bold tracking-tight md:text-6xl">
        {{ profile.name }}
      </h1>
      <p class="mt-4 text-xl text-[var(--muted)] md:text-2xl">
        {{ profile.tagline }}
      </p>
      <div class="mt-8 flex gap-3">
        <a href="#talks" class="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          看演講列表
        </a>
        <a
          v-for="s in profile.socials.filter(x => x.type === 'github')"
          :key="s.url"
          :href="s.url"
          class="rounded border border-[var(--muted)] px-5 py-2.5 text-sm font-medium hover:border-[var(--fg)]"
        >{{ s.label }}</a>
      </div>
    </div>
  </section>
</template>
