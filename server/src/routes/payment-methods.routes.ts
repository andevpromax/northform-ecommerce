import { Router } from 'express'
import { paymentMethods } from '../data/payment-methods.js'

export const paymentMethodsRouter = Router()

paymentMethodsRouter.get('/', (_req, res) => {
	res.json(paymentMethods)
})
