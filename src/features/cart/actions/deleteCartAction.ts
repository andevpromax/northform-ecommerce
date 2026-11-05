export default async function deleteCartAction(_locale: string) {
	const r = await fetch('/api/cart', { method: 'DELETE' })
	if (!r.ok) throw new Error('Unable to empty cart')
	return r.json()
}
