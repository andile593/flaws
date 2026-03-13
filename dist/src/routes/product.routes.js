import { Router } from 'express';
import { getAllProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, } from '../controllers/product.controller';
const router = Router();
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);
export default router;
