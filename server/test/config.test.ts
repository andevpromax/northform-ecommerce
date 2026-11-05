import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

const base = { DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db' }
const token = 'x'.repeat(32)

describe('loadConfig', () => {
	it('allows local development without a token', () => {
		const config = loadConfig(base)
		expect(config).toMatchObject({
			HOST: '127.0.0.1',
			PORT: 4000,
			SESSION_TTL_HOURS: 24,
		})
		expect(config.INTERNAL_API_TOKEN).toBeUndefined()
	})

	it('refuses a public bind address without an internal token', () => {
		expect(() => loadConfig({ ...base, HOST: '0.0.0.0' })).toThrow(
			/INTERNAL_API_TOKEN/,
		)
		expect(
			loadConfig({ ...base, HOST: '0.0.0.0', INTERNAL_API_TOKEN: token }),
		).toBeTruthy()
	})

	it('refuses production without an internal token', () => {
		expect(() => loadConfig({ ...base, NODE_ENV: 'production' })).toThrow(
			/INTERNAL_API_TOKEN/,
		)
	})

	it('rejects short tokens and never echoes secret values', () => {
		const weak = 'short-secret-value'
		let message = ''
		try {
			loadConfig({ ...base, INTERNAL_API_TOKEN: weak })
		} catch (error) {
			message = (error as Error).message
		}
		expect(message).toMatch(/INTERNAL_API_TOKEN/)
		expect(message).not.toContain(weak)
		expect(message).not.toContain(base.DATABASE_URL)
	})

	it('requires DATABASE_URL', () => {
		expect(() => loadConfig({})).toThrow(/DATABASE_URL/)
	})
})
