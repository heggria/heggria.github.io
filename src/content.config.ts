import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.looseObject({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    duration: z.string().optional(),
    lang: z.string().default('zh'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z.string().optional(),
    redirect: z.string().optional(),
    type: z.string().optional(),
  }),
})

export const collections = { posts }
