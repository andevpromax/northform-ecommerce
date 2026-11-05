import { ok, route } from '@/app/api/_lib/route'
import { getProducts } from '@/server/api/products'

export const GET = route(async () => ok(await getProducts()))
