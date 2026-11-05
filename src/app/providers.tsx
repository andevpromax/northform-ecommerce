'use client'
import { useState, type ReactNode } from 'react'
import {
	QueryClient,
	QueryClientProvider,
	MutationCache,
} from '@tanstack/react-query'
import { Talkr } from 'talkr'
import translations from '@/mocks/translations.json'
import showToast, { Notifications } from '@/shared/feedback'
export function Providers({ children }: { children: ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				mutationCache: new MutationCache({
					onError: (error) =>
						showToast({ type: 'error', title: error.message }),
				}),
				defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
			}),
	)
	return (
		<QueryClientProvider client={client}>
			<Talkr languages={{ en: translations }} defaultLanguage="en">
				{children}
				<Notifications />
			</Talkr>
		</QueryClientProvider>
	)
}
