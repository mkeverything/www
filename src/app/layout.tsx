import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

const siteUrl = 'https://mkeverything.org'
const siteName = 'mkeverything'
const title = 'mkeverything — indie software development team'
const description = 'indie software development team building web apps, telegram bots, landing pages, internal tools, and custom software'

const structuredData = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: siteName,
	url: siteUrl,
	email: 'mkevrthng@gmail.com',
	sameAs: [
		'https://github.com/mkeverything',
		'https://t.me/mkevrthng',
	],
	knowsAbout: [
		'web applications',
		'telegram bots',
		'landing pages',
		'internal tools',
		'custom software development',
	],
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body>
				{children}
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
				/>
			</body>
		</html>
	)
}

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: title,
		template: `%s — ${siteName}`,
	},
	description,
	keywords: [
		'mkeverything',
		'make everything',
		'indie developers',
		'software development',
		'web apps',
		'telegram bots',
		'landing pages',
		'internal tools',
		'custom software',
	],
	applicationName: siteName,
	creator: siteName,
	publisher: siteName,
	category: 'software development',
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		url: '/',
		siteName,
		title,
		description,
		locale: 'en_US',
	},
	twitter: {
		card: 'summary',
		title,
		description,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
			'max-video-preview': -1,
		},
	},
	icons: {
		icon: '/favicon.ico',
	},
}

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
		{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
	],
}
