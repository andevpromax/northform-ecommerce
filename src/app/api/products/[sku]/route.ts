import { ok, route } from '@/app/api/_lib/route'
import { getProduct } from '@/server/api/products'

export const GET = route<{ sku: string }>(async ({ params }) =>
	ok(await getProduct(params.sku)),
)
