import { Router } from 'express'
import {
  getAllCollections,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collection.controller'

const router = Router()

router.get('/', getAllCollections)
router.get('/:slug', getCollectionBySlug)
router.post('/', createCollection)
router.patch('/:id', updateCollection)
router.delete('/:id', deleteCollection)

export default router