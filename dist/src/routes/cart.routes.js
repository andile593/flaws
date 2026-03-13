import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, } from '../controllers/cart.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.use(requireAuth); // all cart routes require auth
router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:variantId', updateCartItem);
router.delete('/:variantId', removeFromCart);
router.delete('/', clearCart);
export default router;
