'use client'

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import '../styles/globals.css'

const endpoint = 'https://mktour.org/api/contact'
const rootPath = '/'
const homeRootPath = '/home'
const homePath = '~'
const initialPrompt = 'mkeverything:~$'
const languageStorageKey = 'mkeverything-language'
const languageChangeEvent = 'mkeverything-language-change'
const linkClass = 'underline underline-offset-4 hover:opacity-50 transition-opacity'

type Language = 'en' | 'ru'
type Path = typeof rootPath | typeof homeRootPath | typeof homePath | `~/${string}`

type TranslatedContent = (language: Language) => ReactNode

type HistoryLineContent = ReactNode | TranslatedContent

type HistoryLine = {
	id: number
	content: HistoryLineContent
}

type Project = {
	name: string
	description: string
	ruDescription: string
	href: string
}

const projects: Project[] = [
	{
		name: 'mktour.org',
		description: 'real-time chess tournament manager web app for clubs with real users. works fast, stays in sync and much more',
		ruDescription: 'веб-приложение для проведения шахматных турниров в реальном времени. работает быстро и понятно. есть реальные пользователи',
		href: 'https://mktour.org',
	},
	{
		name: 'radioznb.ru',
		description: 'streaming web platform and infrastructure for an amateur radio station with hand-drawn ui',
		ruDescription: 'стриминг-платформа и инфраструктура для любительской радиостанции с интерфейсом, нарисованным от руки',
		href: 'https://radioznb.ru',
	},
]

const contactFileFor = (language: Language) => language === 'en' ? 'contact.txt' : 'контакты.txt'
const workDirFor = (language: Language) => language === 'en' ? 'current_work' : 'актуальные_проекты'
const currentWorkFor = (language: Language): Path => `~/${workDirFor(language)}`

const projectDescriptionFor = (project: Project, language: Language) =>
	language === 'en' ? project.description : project.ruDescription

const ProjectLine = ({ project, language }: { project: Project, language: Language }) => (
	<>
		<Link href={project.href} className={linkClass}>
			{project.name}
		</Link>
		{'  '}
		{projectDescriptionFor(project, language)}
	</>
)

const CommandLine = ({ prompt, command }: { prompt: string, command: string }) => (
	<p className='relative whitespace-pre-wrap break-all'>
		<span className='absolute left-0 top-0'>{prompt}</span>
		<span style={{ textIndent: `${prompt.length + 1}ch` }} className='block'>
			{command || '\u00a0'}
		</span>
	</p>
)

const projectDetails = (language: Language) =>
	projects.map((project) => <ProjectLine key={project.name} project={project} language={language} />)

const contactOutput = (language: Language) => [
	language === 'en'
		? 'available for hire: custom software development, web apps, telegram bots, landing pages and internal tools'
		: 'доступны для работы: разработка ПО, веб-приложения, телеграм-боты, лендинги и внутренние инструменты',
	<span key='email'>
		<span className='whitespace-pre'>  * email     </span>
		<Link href='mailto:mkevrthng@gmail.com' className={linkClass}>
			mkevrthng@gmail.com
		</Link>
	</span>,
	<span key='github'>
		<span className='whitespace-pre'>  * github    </span>
		<Link href='https://github.com/mkeverything' className={linkClass}>
			github.com/mkeverything
		</Link>
	</span>,
	<span key='telegram'>
		<span className='whitespace-pre'>  * telegram  </span>
		<Link href='https://t.me/mkevrthng' className={linkClass}>
			t.me/mkevrthng
		</Link>
	</span>,
]

const helpOutput = (language: Language) => [
	language === 'en' ? 'usage:' : 'команды:',
	<span key='mail'>
		<span className='whitespace-pre'>  </span>
		<span className='text-emerald-400'>mail you@example.com</span>
		<span className='whitespace-pre'>    {language === 'en' ? 'send your email' : 'отправить email'}</span>
	</span>,
	<span key='lang'>
		<span className='whitespace-pre'>  </span>
		<span className='text-emerald-400'>ru | en</span>
		<span className='whitespace-pre'>                 {language === 'en' ? 'switch language' : 'переключить язык'}</span>
	</span>,
]

const mailOutput = (language: Language) => [
	language === 'en'
		? 'use this command to send us your email and we will contact you'
		: 'этой командой можете отправить нам электронную почту и мы с вами свяжемся',
	'',
	<span key='usage' className='whitespace-pre'>
		{language === 'en' ? '  usage    mail <email>' : '  использование  mail <email>'}
	</span>,
	'',
	<span key='example' className='whitespace-pre'>
		{language === 'en' ? '  example  mail you@example.com' : '  пример         mail you@example.com'}
	</span>,
]

const whoamiOutput = (language: Language) =>
	language === 'en'
		? 'we are an indie software development team building fast web apps, telegram bots, landing pages, internal tools and custom software for businesses'
		: 'мы инди-команда разработки ПО: делаем быстрые веб-приложения, телеграм-ботов, лендинги, внутренние инструменты и софт для бизнеса'

const rootListing = () => 'home'
const homeRootListing = () => 'mkeverything'
const homeListing = (language: Language) => `${contactFileFor(language)}  ${workDirFor(language)}`
const currentWorkListing = () => projects.map((project) => project.name).join('  ')

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const contactError = (data: unknown) => {
	if (!isObject(data) || typeof data.error !== 'string') {
		return 'something went wrong'
	}

	return data.error
}

const contactSent = (data: unknown) => isObject(data) && data.ok === true

const defaultLanguage = () => 'en' as const

const storedLanguage = (): Language =>
	window.localStorage.getItem(languageStorageKey) === 'ru' ? 'ru' : 'en'

const subscribeToLanguage = (onStoreChange: () => void) => {
	window.addEventListener('storage', onStoreChange)
	window.addEventListener(languageChangeEvent, onStoreChange)

	return () => {
		window.removeEventListener('storage', onStoreChange)
		window.removeEventListener(languageChangeEvent, onStoreChange)
	}
}

const saveLanguage = (language: Language) => {
	window.localStorage.setItem(languageStorageKey, language)
	window.dispatchEvent(new Event(languageChangeEvent))
}

const App = () => {
	const [command, setCommand] = useState('')
	const [cwd, setCwd] = useState<Path>(homePath)
	const language = useSyncExternalStore(subscribeToLanguage, storedLanguage, defaultLanguage)
	const [history, setHistory] = useState<HistoryLine[]>([])
	const [commandHistory, setCommandHistory] = useState<string[]>([])
	const [commandHistoryIndex, setCommandHistoryIndex] = useState<number | null>(null)
	const [isSending, setIsSending] = useState(false)
	const [isCleared, setIsCleared] = useState(false)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const historyEndRef = useRef<HTMLDivElement>(null)
	const nextLineId = useRef(0)
	const contactFile = contactFileFor(language)
	const workDir = workDirFor(language)
	const currentWork = currentWorkFor(language)
	const prompt = `mkeverything:${cwd}$`

	const focusInput = () => {
		inputRef.current?.focus()
	}

	const addHistory = (...lines: HistoryLineContent[]) => {
		setHistory((current) => [
			...current,
			...lines.map((content) => ({
				id: nextLineId.current++,
				content,
			})),
		])
	}

	const addLocalizedHistory = (en: ReactNode, ru: ReactNode) => {
		addHistory((nextLanguage) => nextLanguage === 'en' ? en : ru)
	}

	const addTranslatedHistory = (lines: (language: Language) => ReactNode[]) => {
		lines(language).forEach((_, index) => {
			addHistory((nextLanguage) => lines(nextLanguage)[index])
		})
	}

	const clearTerminal = () => {
		setCommand('')
		setCommandHistoryIndex(null)
		setHistory([])
		setIsCleared(true)
	}

	const resolvePath = (path = '.') => {
		const cleanPath = path.replace(/\/+$/, '') || rootPath

		if (cleanPath === '.') {
			return cwd
		}

		if (cleanPath === '..') {
			if (cwd === currentWork) {
				return homePath
			}

			if (cwd === homePath) {
				return homeRootPath
			}

			return rootPath
		}

		if (cleanPath === rootPath) {
			return rootPath
		}

		if (cleanPath === '/home' || (cwd === rootPath && cleanPath === 'home')) {
			return homeRootPath
		}

		if (
			cleanPath === '~' ||
			cleanPath === '/home/mkeverything' ||
			(cwd === homeRootPath && cleanPath === 'mkeverything')
		) {
			return homePath
		}

		if (
			cleanPath === `~/${workDir}` ||
			cleanPath === `/home/mkeverything/${workDir}` ||
			(cwd === homePath && (cleanPath === workDir || cleanPath === `./${workDir}`))
		) {
			return currentWork
		}

		return null
	}

	useEffect(() => {
		focusInput()
	}, [isSending])

	useLayoutEffect(() => {
		const input = inputRef.current

		if (!input) {
			return
		}

		input.style.height = 'auto'
		input.style.height = `${input.scrollHeight}px`
	}, [command])

	useLayoutEffect(() => {
		if (history.length === 0) {
			return
		}

		historyEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
	}, [history.length, isSending])

	useEffect(() => {
		const focusOnKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				clearTerminal()
				focusInput()
				return
			}

			if (event.metaKey || event.ctrlKey || event.altKey || document.activeElement === inputRef.current) {
				return
			}

			focusInput()

			if (event.key.length === 1) {
				event.preventDefault()
				setCommand((current) => current + event.key)
			}
		}

		window.addEventListener('keydown', focusOnKeyDown)

		return () => {
			window.removeEventListener('keydown', focusOnKeyDown)
		}
	}, [])

	const sendEmail = async (email: string) => {
		addLocalizedHistory('sending...', 'отправляем...')
		setIsSending(true)

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			let data: unknown = null

			try {
				data = await response.json()
			} catch {
				// the error line below handles malformed or empty responses
			}

			if (!response.ok || !contactSent(data)) {
				addHistory((nextLanguage) => (
					<span className='text-red-400'>
						{nextLanguage === 'en' ? 'failed' : 'ошибка'}: {contactError(data)}
					</span>
				))
				return
			}

			addLocalizedHistory(
				<span>sent — we got your email and will reach out soon</span>,
				<span>отправлено — мы получили ваш адрес и скоро напишем</span>,
			)
		} catch {
			addHistory((nextLanguage) => (
				<span className='text-red-400'>
					{nextLanguage === 'en' ? 'failed: network error, please try again' : 'ошибка: сеть недоступна, попробуйте ещё раз'}
				</span>
			))
		} finally {
			setIsSending(false)
		}
	}

	const switchLanguage = (nextLanguage: Language) => {
		saveLanguage(nextLanguage)

		if (cwd !== homePath && cwd !== rootPath && cwd !== homeRootPath) {
			setCwd(currentWorkFor(nextLanguage))
		}
	}

	const handleLanguageCommand = (name: Language, args: string[]) => {
		if (args.length > 0) {
			addLocalizedHistory(`${name}: too many arguments`, `${name}: слишком много аргументов`)
			return
		}

		switchLanguage(name)
	}

	const handleCdCommand = (args: string[]) => {
		const target = resolvePath(args[0] || '~')

		if (!target) {
			addLocalizedHistory(
				`cd: no such file or directory: ${args[0]}`,
				`cd: нет такого файла или каталога: ${args[0]}`,
			)
			return
		}

		setCwd(target)
	}

	const handleLsCommand = (args: string[]) => {
		const target = resolvePath(args[0] || '.')

		if (!target) {
			addLocalizedHistory(
				`ls: cannot access '${args[0]}': No such file or directory`,
				`ls: невозможно получить доступ к '${args[0]}': Нет такого файла или каталога`,
			)
			return
		}

		if (target === rootPath) {
			addHistory(rootListing())
			return
		}

		if (target === homeRootPath) {
			addHistory(homeRootListing())
			return
		}

		if (target === homePath) {
			addHistory(homeListing)
			return
		}

		if (target === cwd) {
			addHistory(currentWorkListing())
			return
		}

		addTranslatedHistory(projectDetails)
	}

	const handleCatCommand = (args: string[]) => {
		if (args.length === 0) {
			addLocalizedHistory('usage: cat <file>', 'использование: cat <file>')
			return
		}

		args.forEach((file) => {
			if (cwd === homePath && file === contactFile) {
				addTranslatedHistory(contactOutput)
				return
			}

			if (cwd === homePath && file === workDir) {
				addLocalizedHistory(`cat: ${file}: Is a directory`, `cat: ${file}: Это каталог`)
				return
			}

			addLocalizedHistory(
				`cat: ${file}: No such file or directory`,
				`cat: ${file}: Нет такого файла или каталога`,
			)
		})
	}

	const runCommand = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const value = command.replace(/\s*\n\s*/g, ' ').trim()
		const [name, ...args] = value.split(/\s+/)
		addHistory(<CommandLine prompt={prompt} command={value} />)
		setCommand('')
		setCommandHistoryIndex(null)

		if (!value) {
			return
		}

		setCommandHistory((current) => [...current, value])

		if (name === 'en' || name === 'ru') {
			handleLanguageCommand(name, args)
			return
		}

		if (value === 'help') {
			addTranslatedHistory(helpOutput)
			return
		}

		if (value === 'clear') {
			clearTerminal()
			return
		}

		if (name === 'echo') {
			addHistory(value.slice('echo'.length).trimStart())
			return
		}

		if (value === 'pwd') {
			if (cwd === rootPath || cwd === homeRootPath) {
				addHistory(cwd)
				return
			}

			addHistory((nextLanguage) => cwd === homePath ? '/home/mkeverything' : `/home/mkeverything/${workDirFor(nextLanguage)}`)
			return
		}

		if (value === 'whoami') {
			addHistory(whoamiOutput)
			return
		}

		if (name === 'cd') {
			handleCdCommand(args)
			return
		}

		if (name === 'ls') {
			handleLsCommand(args)
			return
		}

		if (name === 'cat') {
			handleCatCommand(args)
			return
		}

		if (value === 'mail') {
			addTranslatedHistory(mailOutput)
			return
		}

		if (value.startsWith('mail ')) {
			void sendEmail(value.slice('mail '.length).trim())
			return
		}

		addLocalizedHistory(`${name}: command not found`, `${name}: команда не найдена`)
	}

	const browseCommandHistory = (direction: 'previous' | 'next') => {
		if (commandHistory.length === 0) {
			return
		}

		const lastIndex = commandHistory.length - 1
		const nextIndex = direction === 'previous'
			? Math.max(0, commandHistoryIndex === null ? lastIndex : commandHistoryIndex - 1)
			: commandHistoryIndex === null ? null : commandHistoryIndex + 1

		if (nextIndex === null || nextIndex > lastIndex) {
			setCommandHistoryIndex(null)
			setCommand('')
			return
		}

		setCommandHistoryIndex(nextIndex)
		setCommand(commandHistory[nextIndex])
	}

	const handleCommandKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			event.currentTarget.form?.requestSubmit()
			return
		}

		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
			return
		}

		event.preventDefault()
		browseCommandHistory(event.key === 'ArrowUp' ? 'previous' : 'next')
	}

	return (
		<main className='min-h-[100dvh] w-full bg-background pl-2 text-foreground font-mono'>
			<h1 className='sr-only'>mkeverything — custom web apps, telegram bots, landing pages and software development</h1>
			<section aria-label='terminal-style company profile' className='w-full max-w-4xl space-y-5 text-sm sm:text-base leading-relaxed'>
				{!isCleared && (
					<>
						<div>
							<p>{initialPrompt} echo mk means make</p>
							<p>mk means make</p>
						</div>

						<div>
							<p>{initialPrompt} whoami</p>
							<p>{whoamiOutput(language)}</p>
						</div>

						<div>
							<p>{initialPrompt} ls {workDir}</p>
							{projects.map((project) => (
								<p key={project.name}>
									<ProjectLine project={project} language={language} />
								</p>
							))}
						</div>

						<div>
							<p>{initialPrompt} cat {contactFile}</p>
							{contactOutput(language).map((line, index) => (
								<p key={index}>{line}</p>
							))}
						</div>

						<div>
							<p>{initialPrompt} help</p>
							{helpOutput(language).map((line, index) => (
								<p key={index}>{line}</p>
							))}
						</div>
					</>
				)}

				<div>
					{history.map((line) => (
						<div key={line.id}>{typeof line.content === 'function' ? line.content(language) : line.content}</div>
					))}
					{!isSending && (
						<form onSubmit={runCommand} className='relative'>
							<label htmlFor='command' className='pointer-events-none absolute left-0 top-0'>
								{prompt}
							</label>
							<textarea
								ref={inputRef}
								id='command'
								value={command}
								onChange={(event) => {
									setCommand(event.target.value)
									setCommandHistoryIndex(null)
								}}
								onKeyDown={handleCommandKeyDown}
								autoComplete='off'
								autoCapitalize='off'
								autoCorrect='off'
								spellCheck={false}
								rows={1}
								name='terminal-input'
								style={{ textIndent: `${prompt.length + 1}ch` }}
								className='block w-full resize-none overflow-hidden bg-transparent outline-none caret-foreground [caret-shape:block] whitespace-pre-wrap break-all'
							/>
						</form>
					)}
					<div ref={historyEndRef} />
				</div>
			</section>
		</main>
	)
}

export default App
