import { number, z } from 'zod'

import { responseFacetsSchema } from '@/shared/schemas/facet'

export const TagColorVariantSchema = z.enum([
	'darkblue',
	'green',
	'red',
	'blue',
	'lightblue',
	'white',
	'gray',
	'quickfixblue',
])

export type TagColorVariant = z.infer<typeof TagColorVariantSchema>

export const ProductVariantsValueSchema = z.object({
	sku: z.string().optional(),
	slug: z.string().optional(),
	text: z.string().optional(),
	finish: z
		.object({
			id: z.number(),
			name: z.string(),
			icon: z.string().nullable(),
		})
		.optional(),
})

export type ProductVariantsValue = z.infer<typeof ProductVariantsValueSchema>

export const ProductMediaGallerySlideSchema = z.object({
	links: z.array(
		z.object({
			size: z.string(),
			link: z.string(),
		}),
	),
	type: z
		.string()
		.transform((type) => type.toLowerCase())
		.pipe(z.enum(['image', '360image', 'video'])),
	alt: z.string(),
})

export type ProductMediaGallerySlide = z.infer<
	typeof ProductMediaGallerySlideSchema
>

export const ProductFeatureValueSchema = z.object({
	title: z.string(),
	popupTitle: z.string().nullish(),
	icon: z.string(),
	link: z.string().nullish(),
	tooltip: z.string().optional(),
	description: z.string().nullish(),
})

export type ProductFeatureValue = z.infer<typeof ProductFeatureValueSchema>

export const ProductFeatureSchema = z.object({
	type: z.string(),
	values: z.array(ProductFeatureValueSchema),
})

export type ProductFeature = z.infer<typeof ProductFeatureSchema>

export const ProductDetailSparePartsSchema = z.object({
	alternative: z.number(),
	list_number: z.string(),
	valid_from: z.string(),
	valid_to: z.string(),
	zex_url: z.array(z.string()),
	spare_part_skus: z.array(
		z.object({
			is_special: z.boolean(),
			position: z.number(),
			sku: z.string(),
			title: z.string().nullish(),
		}),
	),
})

export type ProductDetailSpareParts = z.infer<
	typeof ProductDetailSparePartsSchema
>

export const ProductDetailDetailsSubsectionSchema = z.object({
	id: z.string(),
	value: z
		.object({
			content: z.string().nullish(),
			downloads: z
				.array(z.object({ name: z.string(), url: z.string() }))
				.nullish(),
			'dimentional-drawing': z.array(z.string()).nullish(),
			skus: z.array(z.string()).nullish(),
			included: z.array(z.string()).nullish(),
			'not-included': z.array(z.string()).nullish(),
			'necessary-skus': z.array(z.string()).nullish(),
			'optional-skus': z.array(z.string()).nullish(),
			starterNotification: z.boolean().nullish(),
			refillNorification: z.boolean().nullish(),
			warranty: z
				.object({
					content: z.string().nullish(),
				})
				.nullish(),
		})
		.optional(),
	videos: z.array(z.string()).nullish(),
	awards: z
		.array(
			z.object({
				graphic_link: z.string(),
				text: z.string(),
			}),
		)
		.nullish(),
	specification_table: z
		.array(
			z.object({
				category: z.string(),
				values: z.array(z.object({ key: z.string(), value: z.string() })),
			}),
		)
		.nullish(),
	'spare-parts': z.array(ProductDetailSparePartsSchema).nullish(),
})

export type ProductDetailDetailsSubsection = z.infer<
	typeof ProductDetailDetailsSubsectionSchema
>

export const ProductDetailDetailsSectionSchema = z.object({
	section: z.string(),
	subsections: z.array(ProductDetailDetailsSubsectionSchema),
})

export type ProductDetailDetailsSection = z.infer<
	typeof ProductDetailDetailsSectionSchema
>

export const ProductDetailDetailsSchema = z.array(
	ProductDetailDetailsSectionSchema,
)

export type ProductDetailDetails = z.infer<typeof ProductDetailDetailsSchema>

export const ProductDetailAPIResponseSchema = z.object({
	sku: z.string(),
	market: z.string(),
	slug: z.string(),
	brand: z.string().nullable(),
	Portfolio: z.string().nullish(),
	title: z.string(),
	collection: z.string(),
	ean: z.string(),
	bundle: z.boolean().nullish(),
	status: z.string().nullable(),
	successor: z.string().nullable(),
	IsWatersystems: z.boolean(),
	hazardousMaterial: z.boolean().optional(),
	hazardousMaterial2: z.boolean().optional(),
	isSpa: z.boolean().nullish(),
	IsSparePart: z.boolean(),
	IsZoovuConfigurable: z.boolean().optional(),
	ZoovuConfigLink: z.string().nullish(),
	tags: z.array(
		z.object({
			type: z.string(),
			values: z.array(
				z.object({
					id: z.number(),
					name: z.string(),
					color: TagColorVariantSchema,
				}),
			),
		}),
	),
	features: z.array(ProductFeatureSchema),
	variants: z.array(
		z.object({
			type: z.enum(['FinishVariants', 'SizeVariants', 'FeatureVariants']),
			values: z.array(ProductVariantsValueSchema),
		}),
	),
	media: z.array(ProductMediaGallerySlideSchema),
	categories: z.array(
		z.object({
			type: z.string(),
			values: z.array(
				z.object({
					id: z.number(),
					name: z.string(),
					path: z.string(),
					slug: z.string(),
				}),
			),
		}),
	),
	details: ProductDetailDetailsSchema,
	dimensionalDrawing: z.string().nullish(),
	dimensionalDrawingInches: z.string().optional().nullish(),
	alternativeProducts: z.array(z.string()).optional(),
	suggestedProducts: z.array(z.string()).optional(),
	SurfaceL3090: z.boolean().optional(),
	where_to_buy_filter_ids: z.array(number()),
	vvsDenmark: z.string().nullish(),
	rskSweden: z.string().nullish(),
	nrfNorway: z.string().nullish(),
	// Custom
	breadcrumbs: z
		.array(
			z.object({
				name: z.string(),
				url: z.string(),
			}),
		)
		.optional(),
})

export type ProductDetailAPIResponse = z.infer<
	typeof ProductDetailAPIResponseSchema
>

export const ProductPriceUpdatedSchema = z.object({
	sku: z.string(),
	userPrice: z.number(),
	originalPrice: z.number(),
	currencyISO: z.string(),
	transactibility: z.boolean(),
	discountPercentage: z.number(),
	promotionId: z.string().nullish().optional(),
	promotionLabel: z.string().nullish().optional(),
	promotionType: z.string().nullish().optional(),
	promotionValidUntil: z.string().nullish(),
	vatPercentage: z.number().nullish().optional(),
	vatAmount: z.number().nullish().optional(),
	priceWithVAT: z.number().nullish().optional(),
	originalPriceNet: z.number().nullish().optional(),
	originalPriceVAT: z.number().nullish().optional(),
	userPriceNet: z.number(),
	userPriceVAT: z.number(),
	discountedPriceNet: z.number(),
	discountedPriceVAT: z.number(),
	ecoContributionType: z.string().optional(),
	ecoContributionValue: z.number().optional(),
	orderUnit: z.number().optional(),
})

export type ProductPriceUpdated = z.infer<typeof ProductPriceUpdatedSchema>

export const ProductPricingAPIResponseSchema = z.object({
	prices: z.array(ProductPriceUpdatedSchema),
})

export type ProductPricingAPIResponse = z.infer<
	typeof ProductPricingAPIResponseSchema
>

export const ProductTagSchema = z.object({
	id: z.string(),
	color: TagColorVariantSchema,
	label: z.string(),
})

export type ProductTag = z.infer<typeof ProductTagSchema>

export const ProductFinishSchema = z.object({
	id: z.number(),
	color: z.string(),
	name: z.string(),
	sku: z.string(),
	slug: z.string(),
	ean: z.number().optional(),
	tagIds: z.array(z.string()).optional(),
	size: z.string().nullish(),
	image: z.string(),
	icon: z.string(),
	onlineBuyOnly: z.boolean().optional(),
})

export type ProductFinish = z.infer<typeof ProductFinishSchema>

const ProductSchema = z.object({
	baseSku: z.string(),
	title: z.string(),
	isSpa: z.boolean(),
	isWs: z.boolean(),
	isSp: z.boolean(),
	categories: z.array(z.string()),
	collection: z.string(),
	imageUrl: z.string(),
	installation: z.string().nullish(),
	onlineBuyOnly: z.boolean(),
	newUntilDate: z.string().nullish(),
	tags: z.array(ProductTagSchema),
	finishes: z.array(ProductFinishSchema),
	size: z.string().optional(),
	isZoovuConfigurable: z.boolean().nullish(),
	zoovuConfigLink: z.string().nullish(),
	subBrand: z.string().nullish(),
})
export type Product = z.infer<typeof ProductSchema>

export const ProductsSearchAPIResponseSchema = z.object({
	rfk_id: z.string(),
	entity: z.string(),
	total: z.number(),
	results: z.array(ProductSchema),
	facets: responseFacetsSchema,
})

export type ProductsSearchAPIResponse = z.infer<
	typeof ProductsSearchAPIResponseSchema
>

const ProductsSearchAPIRequestSchema = z.object({
	offset: z.number(),
	limit: z.number().max(40),
	lang: z.string(),
	q: z.string().min(3).optional(),
	uid: z.string().optional(),
	uuid: z.string().optional(),
	url: z.string().optional(),
	skus: z.array(z.string()).optional(),
	categories: z.array(z.string()).optional(),
	isSp: z.boolean().optional(),
	facets: z
		.array(
			z.object({
				name: z.string(),
				ids: z.array(z.string()),
			}),
		)
		.optional(),
})

export type ProductsSearchAPIRequest = z.infer<
	typeof ProductsSearchAPIRequestSchema
>

const GridColsSchema = z.union([
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
])

export type GridCols = z.infer<typeof GridColsSchema>

const ProductCategoryBreadcrumbsSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	url: z.string(),
})

export type ProductCategoryBreadcrumbs = z.infer<
	typeof ProductCategoryBreadcrumbsSchema
>

const ProductCategoryAPIResponseSchema = z.array(
	z.object({
		id: z.string(),
		market: z.string(),
		language: z.string(),
		name: z.string(),
		parentId: z.string(),
		priority: z.number().nullish(),
		slug: z.string(),
		path: z.string(),
		media: z.object({
			link: z.string(),
			type: z.string(),
			alt: z.string(),
		}),
		ancestors: z.array(
			z.object({
				id: z.string(),
				slug: z.string(),
				name: z.string(),
				path: z.string(),
			}),
		),
		type: z.enum(['Link', 'Filter']),
		menu_visibility: z.boolean().optional(),
		// Custom
		breadcrumbs: z.array(ProductCategoryBreadcrumbsSchema).optional(),
		breadcrumbsIds: z.array(z.string()).optional(),
	}),
)

export type ProductCategoryAPIResponse = z.infer<
	typeof ProductCategoryAPIResponseSchema
>

type ProductCategoryRedirect = {
	next: string
}

export type GetCategoriesAPIResult =
	| ProductCategoryAPIResponse
	| ProductCategoryRedirect
	| undefined

export const ProductAllVariantsAPIResponseSchema = z.object({
	skus: z.record(
		z.string(),
		z.object({
			finish: z.string(),
			size: z.string(),
		}),
	),
	finishes: z.record(
		z.string(),
		z.array(
			z.object({
				size: z.string(),
				sku: z.string(),
			}),
		),
	),
	sizes: z.record(
		z.string(),
		z.array(
			z.object({
				finish: z.string(),
				sku: z.string(),
			}),
		),
	),
	finishValues: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			icon: z.string(),
		}),
	),
	sizeValues: z.array(z.string()),
})

export type ProductAllVariantsAPIResponse = z.infer<
	typeof ProductAllVariantsAPIResponseSchema
>

export const EcoConfigsItemSchema = z.object({
	type: z.string().nullish(),
	value: z.string().nullish(),
	sku: z.string(),
})

export type EcoConfigsItem = z.infer<typeof EcoConfigsItemSchema>

export const EcoConfigsAPIResponseSchema = z.object({
	ecoConfigs: z.array(EcoConfigsItemSchema),
})

export type EcoConfigsAPIResponse = z.infer<typeof EcoConfigsAPIResponseSchema>
