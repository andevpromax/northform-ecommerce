import type { EcommerceProductFields } from '@/features/tracking/ecommerce/types'
import type { ProductPriceUpdated } from '@/shared/schemas/product'
const productFieldsMap: Record<string, EcommerceProductFields> = {}
const prices: Record<string, ProductPriceUpdated> = {}
export const useEcommerceEnrichment = (_skus: string[]) => ({
	productFieldsMap,
	prices,
	isLoading: false,
})
