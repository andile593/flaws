import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// GET /api/collections
export const getAllCollections = async (req: Request, res: Response) => {
  const collections = await prisma.collection.findMany({
    include: { products: true },
  })
  res.json(collections)
}

// GET /api/collections/:slug
export const getCollectionBySlug = async (req: Request, res: Response) => {
  const slug = req.params.slug as string
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { images: true, variants: true },
      },
    },
  })
  if (!collection) return res.status(404).json({ message: 'Collection not found' })
  res.json(collection)
}

// POST /api/collections
export const createCollection = async (req: Request, res: Response) => {
  const { name, slug, description, imageUrl, gender } = req.body
  const collection = await prisma.collection.create({
    data: { name, slug, description, imageUrl, gender },
  })
  res.status(201).json(collection)
}

// PATCH /api/collections/:id
export const updateCollection = async (req: Request, res: Response) => {
  const id = req.params.id as string
  const collection = await prisma.collection.update({
    where: { id },
    data: req.body,
  })
  res.json(collection)
}

// DELETE /api/collections/:id
export const deleteCollection = async (req: Request, res: Response) => {
  const id = req.params.id as string
  await prisma.collection.delete({ where: { id } })
  res.json({ message: 'Collection deleted' })
}