import { Router } from 'express'
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getRelatedProducts,
} from '../controllers/product.controller'

const router = Router()

router.get('/search', searchProducts)

// Then dynamic routes
router.get('/', getAllProducts)
router.post('/', createProduct)
router.get('/:slug', getProductBySlug)
router.get('/:slug/related', getRelatedProducts)
router.patch('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router