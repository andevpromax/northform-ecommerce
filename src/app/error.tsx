'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
	return (
		<div role="alert" className="panel">
			<h1>Something went wrong</h1>
			<p>Please try again.</p>
			<button onClick={reset} className="mt-4 underline">
				Try again
			</button>
		</div>
	)
}
