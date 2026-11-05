'use client'
import { useEffect, useState } from 'react'
type Notice = {
	title: string
	type?: string
	link?: { href: string; label: string }
	useCustomAnnouncement?: boolean
}
export default function showToast(notice: Notice) {
	if (typeof window !== 'undefined')
		window.dispatchEvent(new CustomEvent('showcase-notice', { detail: notice }))
}
export function Notifications() {
	const [announcement, setAnnouncement] = useState('')
	useEffect(() => {
		const listener = (event: Event) =>
			setAnnouncement((event as CustomEvent<string>).detail)
		window.addEventListener('showcase-announcement', listener)
		return () => window.removeEventListener('showcase-announcement', listener)
	}, [])
	const [notice, setNotice] = useState<Notice | null>(null)
	useEffect(() => {
		if (!notice) return
		const timer = setTimeout(() => setNotice(null), 6000)
		return () => clearTimeout(timer)
	}, [notice])
	useEffect(() => {
		const listener = (event: Event) =>
			setNotice((event as CustomEvent<Notice>).detail)
		window.addEventListener('showcase-notice', listener)
		return () => window.removeEventListener('showcase-notice', listener)
	}, [])
	return (
		<>
			<span className="sr-only" aria-live="polite">
				{announcement}
			</span>
			{notice ? (
				<aside
					role={notice.type === 'error' ? 'alert' : 'status'}
					className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border bg-white p-5 shadow-xl"
				>
					<p>{notice.title}</p>
					{notice.link && (
						<a className="underline" href={notice.link.href}>
							{notice.link.label}
						</a>
					)}
					<button
						className="ml-4 underline"
						onClick={() => setNotice(null)}
						aria-label="Dismiss notification"
					>
						Dismiss
					</button>
				</aside>
			) : null}
		</>
	)
}
