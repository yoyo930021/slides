<script setup lang="ts">
import { profile } from '@/data/profile'

const iconClass: Record<string, string> = {
  github: 'i-mdi-github',
  email: 'i-mdi-email-outline',
  twitter: 'i-mdi-twitter',
  other: 'i-mdi-link-variant',
}
</script>

<template>
  <footer class="px-6 py-12 text-sm text-[var(--muted)]">
    <div class="mx-auto flex max-w-3xl flex-col items-center gap-4">
      <ul class="flex gap-4">
        <li v-for="s in profile.socials" :key="s.url">
          <a :href="s.url" :title="s.label" class="inline-flex items-center gap-1.5 hover:text-[var(--fg)]">
            <span :class="iconClass[s.type] ?? iconClass.other" />
            <span>{{ s.label }}</span>
          </a>
        </li>
      </ul>
      <p>© {{ new Date().getFullYear() }} {{ profile.name }}</p>
    </div>
  </footer>
</template>
