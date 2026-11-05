'use client'
const announce = (message: string) => {
	if (typeof window !== 'undefined')
		window.dispatchEvent(
			new CustomEvent('showcase-announcement', { detail: message }),
		)
}
export const useAnnouncer = () => ({ announce })
