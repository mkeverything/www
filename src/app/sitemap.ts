import type { MetadataRoute } from 'next'

const siteUrl = 'https://mkeverything.org'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: siteUrl,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
	]
}
