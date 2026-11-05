import { ok, route } from '@/app/api/_lib/route'

// Kept for contract compatibility: guests have no saved addresses.
export const GET = route(async () => ok({ data: [] }))
