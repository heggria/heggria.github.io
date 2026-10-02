import type { CollectionEntry } from 'astro:content'

type Post = CollectionEntry<'posts'>
export function readingMinutes(body = '') {
  const clean = body.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  const chinese = (clean.match(/[\u3400-\u9fff]/g) || []).length
  const words = (clean.match(/[a-zA-Z]+(?:['-][a-zA-Z]+)*/g) || []).length
  return Math.max(1, Math.ceil(chinese / 450 + words / 220))
}
export function formatDate(date: Date, compact = false) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: compact ? undefined : 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
export const yearOf = (post: Post) => Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric' }).format(post.data.date))
export const postLink = (post: Post) => post.data.redirect || `/writing/${post.id}/`
export const published = (post: Post) => !post.data.draft && post.data.date <= new Date()
export const newestFirst = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf()
