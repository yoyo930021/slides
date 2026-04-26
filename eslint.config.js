import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  ignores: [
    'dist',
    'node_modules',
    '**/*.generated.*',
    'landing/src/data/talks.generated.json',
    'docs/**',
    'pnpm-lock.yaml',
    'talks/**',
  ],
})
