import { z } from 'zod'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost'])

const envSchema = z
	.object({
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		HOST: z.string().min(1).default('127.0.0.1'),
		PORT: z.coerce.number().int().min(1).max(65535).default(4000),
		DATABASE_URL: z.string().url(),
		INTERNAL_API_TOKEN: z
			.string()
			.optional()
			.transform((value) => value || undefined)
			.pipe(z.string().min(32).optional()),
		SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(24),
	})
	.superRefine((env, ctx) => {
		const exposed =
			env.NODE_ENV === 'production' || !LOOPBACK_HOSTS.has(env.HOST)
		if (exposed && !env.INTERNAL_API_TOKEN)
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['INTERNAL_API_TOKEN'],
				message:
					'is required when NODE_ENV=production or HOST is not a loopback address',
			})
	})

export type Config = z.infer<typeof envSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
	const parsed = envSchema.safeParse(env)
	if (!parsed.success) {
		// Report variable names only; never echo values such as secrets or URLs.
		const problems = parsed.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join('; ')
		throw new Error(`Invalid server configuration. ${problems}`)
	}
	return parsed.data
}

// Business constants of the showcase. Not stored in the database because
// nothing in the application edits them.
export const commerce = {
	currency: 'EUR',
	shippingCents: 500,
	vatRatePercent: 20,
	maxQuantity: 99,
	maxOrdersPerSession: 50,
	maxPaymentAttempts: 20,
} as const
