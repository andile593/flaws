"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
router.get('/search', product_controller_1.searchProducts);
// Then dynamic routes
router.get('/', product_controller_1.getAllProducts);
router.post('/', product_controller_1.createProduct);
router.get('/:slug', product_controller_1.getProductBySlug);
router.get('/:slug/related', product_controller_1.getRelatedProducts);
router.patch('/:id', product_controller_1.updateProduct);
router.delete('/:id', product_controller_1.deleteProduct);
exports.default = router;
