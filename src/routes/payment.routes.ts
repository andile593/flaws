// payment.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { initializePayment, payfastITN, verifyPayment } from '../controllers/payment.controller'

const router = Router()

router.post('/notify', payfastITN)                        // PayFast ITN — no auth
router.post('/initialize', requireAuth, initializePayment)
router.get('/verify/:reference', requireAuth, verifyPayment)

export default router