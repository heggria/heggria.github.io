import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { published, newestFirst } from '../lib/posts'

export async function GET(context: { site: URL }) {
  const posts = (await getCollection('posts')).filter(published).sort(newestFirst)
  return rss({
    title: 'Heggria 的文章',
    description: '项目开发和前端技术笔记。',
    site: context.site,
    customData: '<language>zh-CN</language>',
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description || post.data.title,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
    })),
  })
}
