import { cookies } from 'next/headers'
import { z } from 'zod'

export const SESSION_COOKIE = 'showcase-session'

const sessionIdSchema = z.string().uuid()

// The guest session ID is forwarded to Express as X-Session-Id, so only
// well-formed UUIDs are accepted; anything else is treated as no session.
export function parseSessionId(value: string | undefined): string | null {
	const parsed = sessionIdSchema.safeParse(value)
	return parsed.success ? parsed.data.toLowerCase() : null
}

// For Server Components. Route Handlers create the session; pages only read it.
export async function readSession() {
	return parseSessionId((await cookies()).get(SESSION_COOKIE)?.value)
}
