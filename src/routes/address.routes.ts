import { Router } from 'express'
import { addAddress, getUserAddresses } from '../controllers/address.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

router.use(requireAuth)
router.post('/', addAddress)
router.get('/', getUserAddresses)

export default router