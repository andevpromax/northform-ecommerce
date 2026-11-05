import Link from 'next/link'
export default function NotFound() {
	return (
		<div className="panel">
			<h1>We could not find that page or order.</h1>
			<p className="my-4">
				It may belong to another session, or the demo server may have restarted.
			</p>
			<Link className="underline" href="/products">
				Browse the collection
			</Link>
		</div>
	)
}
