import type { Metadata } from 'next'
import Link from 'next/link'
import { Providers } from './providers'
import { CartNavLink } from '@/features/cart/components/CartNavLink'
import './globals.css'
export const metadata: Metadata = {
	title: 'North & Form | Engineering Showcase',
	description:
		'A fictional store demonstrating production-derived cart, checkout and simulated payment.',
}
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<a href="#main" className="sr-only focus:not-sr-only">
						Skip to content
					</a>
					<div className="bg-brand-800 px-4 py-2 text-center text-xs tracking-wide text-white">
						Engineering showcase · Fictional products · Simulated payments only
					</div>
					<header className="border-b bg-white">
						<nav
							aria-label="Main navigation"
							className="mx-auto flex max-w-7xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between px-6 py-7"
						>
							<Link
								className="whitespace-nowrap text-2xl font-semibold tracking-tight"
								href="/"
							>
								North & Form<span className="text-brand-500">.</span>
							</Link>
							<div className="flex gap-6">
								<Link href="/products">Collection</Link>
								<CartNavLink />
								<Link href="/orders">Your orders</Link>
							</div>
						</nav>
					</header>
					<main id="main" className="mx-auto min-h-[75vh] max-w-7xl px-6 py-10">
						{children}
					</main>
					<footer className="border-t p-8 text-center text-sm text-gray-500">
						A working engineering demo. No purchases, card details or real
						payments.
					</footer>
				</Providers>
			</body>
		</html>
	)
}
