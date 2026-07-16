import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: { site: URL }) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  return rss({
    title: 'Heggria — Writing',
    description: '关于工程判断、系统、工具与那些值得被保留下来的思考。',
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
