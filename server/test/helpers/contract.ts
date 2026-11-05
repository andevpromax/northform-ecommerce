import { expect } from 'vitest'
import { openApiDocument } from '../../src/docs/openapi.js'

export type Schema = {
	$ref?: string
	allOf?: Schema[]
	type?: string
	nullable?: boolean
	format?: string
	required?: string[]
	properties?: Record<string, Schema>
	additionalProperties?: boolean
	items?: Schema
	enum?: unknown[]
	minimum?: number
	maximum?: number
	minLength?: number
	maxLength?: number
	maxItems?: number
}

type MediaType = {
	schema: Schema
	example?: unknown
	examples?: Record<string, { value: unknown }>
}
export type ResponseObject = {
	$ref?: string
	description: string
	content?: { 'application/json': MediaType }
}
type Operation = { responses: Record<string, ResponseObject> }

const doc = openApiDocument as unknown as {
	paths: Record<string, Record<string, Operation>>
	components: {
		schemas: Record<string, Schema>
		responses: Record<string, ResponseObject>
	}
}

export function resolveResponse(response: ResponseObject): ResponseObject {
	if (!response.$ref) return response
	return doc.components.responses[response.$ref.split('/').pop() as string]
}

const UUID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Minimal validator for the JSON Schema subset used in the spec, so real
// responses can be checked against the documented schemas without extra deps.
export function validate(schema: Schema, value: unknown, path = '$'): string[] {
	if (schema.$ref) {
		const target =
			doc.components.schemas[schema.$ref.split('/').pop() as string]
		if (!target) return [`${path}: unresolved ${schema.$ref}`]
		return validate(target, value, path)
	}
	if (schema.allOf) return schema.allOf.flatMap((s) => validate(s, value, path))
	if (value === null)
		return schema.nullable || schema.type === undefined
			? []
			: [`${path}: unexpected null`]
	if (schema.enum && !schema.enum.includes(value))
		return [`${path}: ${JSON.stringify(value)} not in enum`]
	const errors: string[] = []
	switch (schema.type) {
		case 'object': {
			if (typeof value !== 'object' || Array.isArray(value))
				return [`${path}: expected object`]
			const record = value as Record<string, unknown>
			for (const key of schema.required ?? [])
				if (!(key in record)) errors.push(`${path}.${key}: missing`)
			for (const [key, child] of Object.entries(record)) {
				const property = schema.properties?.[key]
				if (property)
					errors.push(...validate(property, child, `${path}.${key}`))
				else if (schema.additionalProperties === false)
					errors.push(`${path}.${key}: not documented`)
			}
			return errors
		}
		case 'array':
			if (!Array.isArray(value)) return [`${path}: expected array`]
			if (schema.maxItems !== undefined && value.length > schema.maxItems)
				errors.push(`${path}: more than ${schema.maxItems} items`)
			return errors.concat(
				value.flatMap((item, i) =>
					schema.items ? validate(schema.items, item, `${path}[${i}]`) : [],
				),
			)
		case 'integer':
			if (!Number.isInteger(value)) return [`${path}: expected integer`]
			break
		case 'number':
		case 'string':
		case 'boolean':
			if (typeof value !== schema.type)
				return [`${path}: expected ${schema.type}`]
			break
	}
	if (typeof value === 'number') {
		if (schema.minimum !== undefined && value < schema.minimum)
			errors.push(`${path}: below minimum ${schema.minimum}`)
		if (schema.maximum !== undefined && value > schema.maximum)
			errors.push(`${path}: above maximum ${schema.maximum}`)
	}
	if (typeof value === 'string') {
		if (schema.format === 'uuid' && !UUID.test(value))
			errors.push(`${path}: not a uuid`)
		if (schema.format === 'date-time' && Number.isNaN(Date.parse(value)))
			errors.push(`${path}: not a date-time`)
		if (schema.minLength !== undefined && value.length < schema.minLength)
			errors.push(`${path}: shorter than ${schema.minLength}`)
		if (schema.maxLength !== undefined && value.length > schema.maxLength)
			errors.push(`${path}: longer than ${schema.maxLength}`)
	}
	return errors
}

export function documentedOperation(method: string, path: string) {
	const operation = doc.paths[path]?.[method.toLowerCase()]
	if (!operation) throw new Error(`${method} ${path} is not documented`)
	return operation
}

// Asserts that a real response uses a documented status code and that its body
// matches the documented schema.
export function expectContract(
	res: { status: number; body: unknown },
	method: string,
	path: string,
) {
	const operation = documentedOperation(method, path)
	const documented = operation.responses[res.status]
	expect(
		documented,
		`${method} ${path} returned undocumented status ${res.status}`,
	).toBeDefined()
	const media = resolveResponse(documented).content?.['application/json']
	if (media) expect(validate(media.schema, res.body)).toEqual([])
}
