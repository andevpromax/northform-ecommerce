import { ok, route } from '@/app/api/_lib/route'

// Kept for contract compatibility: guests have no stored cards.
export const GET = route(async () => ok({ data: [] }))
