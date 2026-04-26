import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2 }),
  ],
  theme: {
    fontFamily: {
      sans: '"Inter", "Noto Sans TC", system-ui, sans-serif',
    },
  },
})
