<script setup lang="ts">
import { profile } from '@/data/profile'
</script>

<template>
  <section class="px-6 py-16">
    <div class="mx-auto max-w-3xl">
      <h2 class="text-2xl font-bold md:text-3xl">
        關於
      </h2>
      <p class="mt-6 leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>
  </section>
</template>
