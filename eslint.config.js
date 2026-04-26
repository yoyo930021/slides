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
  ],
}, {
  files: ['scripts/**/*.{mjs,js,ts}'],
  rules: {
    'node/prefer-global/process': 'off',
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-named-imports': 'off',
  },
}, {
  files: ['talks/**/*.md'],
  rules: {
    'markdown/no-multiple-h1': 'off',
  },
})
