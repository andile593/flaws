import { Router, Request, Response, NextFunction } from 'express'
import express from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { initializePayment, paystackWebhook, verifyPayment } from '../controllers/payment.controller'

const router = Router()

// Webhook must use raw body — register before express.json parses it
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhook
)

router.post('/initialize', requireAuth, initializePayment)
router.get('/verify/:reference', requireAuth, verifyPayment)

export default router