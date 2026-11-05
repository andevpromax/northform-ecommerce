import { z } from 'zod'

export const responseFacetSchema = z.object({
	id: z.string(),
	value: z.string(),
	count: z.number(),
})

export const responseFacetsSchema = z.record(
	z.string(),
	z.array(responseFacetSchema),
)

export type ResponseFacet = z.infer<typeof responseFacetSchema>
export type ResponseFacets = z.infer<typeof responseFacetsSchema>
