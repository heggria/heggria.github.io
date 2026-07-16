import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import sitemap from '@astrojs/sitemap'
import remarkGfm from 'remark-gfm'

export default defineConfig({
  site: 'https://heggria.github.io',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      namespaces: { news: false, video: false },
    }),
  ],
  markdown: {
    processor: unified({ remarkPlugins: [remarkGfm] }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
})
