import { ok, route } from '@/app/api/_lib/route'
import { getPaymentMethods } from '@/server/api/payments'

export const GET = route(async () => ok({ data: await getPaymentMethods() }))
