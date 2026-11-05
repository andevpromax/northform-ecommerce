import express from 'express'
import swaggerUi from 'swagger-ui-express'
import type { Db } from './db/client.js'
import { openApiDocument } from './docs/openapi.js'
import { HttpError } from './errors.js'
import { errorHandler } from './middleware/error-handler.js'
import { requireInternalToken } from './middleware/internal-token.js'
import { requireSession } from './middleware/session.js'
import { createCartRouter } from './routes/cart.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { createOrdersRouter } from './routes/orders.routes.js'
import { paymentMethodsRouter } from './routes/payment-methods.routes.js'
import { createProductsRouter } from './routes/products.routes.js'

export type AppOptions = {
	db: Db
	internalToken?: string
}

export function createApp({ db, internalToken }: AppOptions) {
	const app = express()
	app.disable('x-powered-by')

	app.use((_req, res, next) => {
		res.set('Cache-Control', 'no-store')
		next()
	})
	app.use(express.json({ limit: '16kb' }))

	app.use('/health', healthRouter)
	app.get('/openapi.json', (_req, res) => {
		res.json(openApiDocument)
	})
	app.use(
		'/api-docs',
		swaggerUi.serve,
		swaggerUi.setup(openApiDocument, {
			swaggerOptions: { persistAuthorization: true },
		}),
	)

	// Public catalogue data: no session and no internal token.
	app.use('/api/products', createProductsRouter(db))

	// Everything else under /api is internal and guest-session scoped.
	const internal = express.Router()
	internal.use(requireInternalToken(internalToken))
	internal.use('/payment-methods', paymentMethodsRouter)
	internal.use('/cart', requireSession, createCartRouter(db))
	internal.use('/orders', requireSession, createOrdersRouter(db))
	app.use('/api', internal)

	app.use(() => {
		throw new HttpError(404, 'Endpoint not found')
	})
	app.use(errorHandler)
	return app
}
